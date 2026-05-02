import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { DRIVES_LIST_POLL_MS } from "../../../shared/drives/discovery";
import {
  countEligibleDrives,
  fetchApplicationsList,
  fetchDrivesList,
  fetchFeaturedDrives,
  fetchNotificationsList,
  fetchOffersList,
  fetchRoundsList,
  fetchStudentProfileMe,
  mergeFeaturedAndAllDrives,
  normalizeApplicationRow,
  normalizeDrive,
  normalizeOfferRow,
  normalizeRoundRow,
  pickRecommendedDrives
} from "../../../shared/api/student";
import { studentDashboardData } from "../../../shared/data/dashboardData";

function unwrapList(payload) {
  if (!payload) {
    return [];
  }
  if (Array.isArray(payload.items)) {
    return payload.items;
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  return [];
}

function mockDrivesNormalized() {
  return studentDashboardData.drives.map((d) => normalizeDrive(d));
}

function mockApplicationsNormalized() {
  return studentDashboardData.applications.map((a) =>
    normalizeApplicationRow(
      {
        applicationId: a.id,
        driveId: a.driveId,
        driveTitle: a.role,
        companyName: a.company,
        status: a.status,
        currentRound: "",
        email: "student@orbiton"
      },
      a.role
    )
  );
}

function formatFallbackNotifications() {
  return studentDashboardData.notifications.map((n) => ({
    id: n.id,
    message: n.message,
    sentAt: n.sentAt,
    isRead: false
  }));
}

export function useStudentDashboardData() {
  const { user } = useAuth();
  const email = user?.email?.toLowerCase() || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(/** @type {string|null} */ (null));
  const [profile, setProfile] = useState(studentDashboardData.profileResume);
  const [drives, setDrives] = useState(mockDrivesNormalized);
  const [featuredDrives, setFeaturedDrives] = useState(() => mockDrivesNormalized().filter((d) => d.status === "Open").slice(0, 4));
  const [recommendedDrives, setRecommendedDrives] = useState(mockDrivesNormalized().slice(0, 3));
  const [applications, setApplications] = useState(mockApplicationsNormalized);
  const [rounds, setRounds] = useState(studentDashboardData.rounds);
  const [offers, setOffers] = useState(() => studentDashboardData.offers.map((o) => normalizeOfferRow(o)));
  const [notifications, setNotifications] = useState(formatFallbackNotifications);

  const profileRef = useRef(profile);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [profileRes, drivesRes, featuredRes, appsRes, roundsRes, offersRes, notifRes] = await Promise.all([
        fetchStudentProfileMe().catch(() => null),
        fetchDrivesList().catch(() => null),
        fetchFeaturedDrives().catch(() => null),
        fetchApplicationsList().catch(() => null),
        fetchRoundsList().catch(() => null),
        fetchOffersList().catch(() => null),
        fetchNotificationsList().catch(() => null)
      ]);

      const nextProfile = profileRes || studentDashboardData.profileResume;
      setProfile(nextProfile);

      const { all, featured } = mergeFeaturedAndAllDrives(drivesRes, featuredRes);
      const driveList = all.length > 0 ? all : mockDrivesNormalized();
      const feat =
        featured.length > 0 ? featured : mockDrivesNormalized().filter((d) => d.status === "Open").slice(0, 6);

      setDrives(driveList);
      setFeaturedDrives(feat);
      setRecommendedDrives(pickRecommendedDrives(driveList, nextProfile));

      const driveMap = new Map(driveList.map((d) => [d.id, d]));

      const appItems = unwrapList(appsRes);
      let appRows = appItems.map((row) => normalizeApplicationRow(row, row.driveTitle || ""));
      appRows = appRows.map((r) => ({
        ...r,
        companyName: (r.driveId && driveMap.get(r.driveId)?.companyName) || r.companyName
      }));

      if (email) {
        const mine = appRows.filter((r) => r.email && r.email.toLowerCase() === email);
        appRows = mine.length > 0 ? mine : [];
      }

      if (appRows.length === 0) {
        appRows = mockApplicationsNormalized();
      }
      setApplications(appRows);

      const roundItems = unwrapList(roundsRes);
      let roundRows = roundItems.map((r) => normalizeRoundRow(r, driveMap));
      const myAppIds = new Set(appRows.map((a) => a.id));
      if (myAppIds.size > 0 && roundItems.length > 0) {
        const filtered = roundRows.filter((r) => r.candidateId && myAppIds.has(r.candidateId));
        if (filtered.length > 0) {
          roundRows = filtered;
        }
      }
      if (roundRows.length === 0) {
        roundRows = studentDashboardData.rounds;
      }
      setRounds(roundRows);

      const offerItems = unwrapList(offersRes);
      let offerRows = offerItems.map((o) => {
        const base = normalizeOfferRow(o);
        const d = driveMap.get(o.driveId || "");
        return {
          ...base,
          companyName: d?.companyName || base.companyName,
          roleTitle: d?.roleTitle || base.roleTitle
        };
      });

      if (email) {
        const mine = offerRows.filter((o) => o.email && o.email.toLowerCase() === email && o.status === "OFFERED");
        offerRows = mine.length > 0 ? mine : [];
      }

      if (offerRows.length === 0) {
        offerRows = studentDashboardData.offers.map((o) => normalizeOfferRow(o));
      }
      setOffers(offerRows);

      if (notifRes?.items && Array.isArray(notifRes.items)) {
        setNotifications(notifRes.items);
      } else {
        setNotifications(formatFallbackNotifications());
      }
    } catch (e) {
      setError(e?.message || "Could not load dashboard");
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const refreshDrives = async () => {
      try {
        const profileRes = await fetchStudentProfileMe();
        if (profileRes && typeof profileRes === "object") {
          setProfile(profileRes);
          profileRef.current = profileRes;
        }
      } catch {
        /* keep cached profile on transient failure */
      }

      let drivesRes = null;
      let featuredRes = null;
      try {
        drivesRes = await fetchDrivesList();
      } catch {
        /* keep null — do not replace a good list on transient failure */
      }
      try {
        featuredRes = await fetchFeaturedDrives();
      } catch {
        /* optional companion request */
      }
      if (drivesRes == null) {
        return;
      }
      const { all, featured } = mergeFeaturedAndAllDrives(drivesRes, featuredRes);
      setDrives(all);
      setFeaturedDrives(featured);
      setRecommendedDrives(pickRecommendedDrives(all, profileRef.current));
    };

    const intervalId = window.setInterval(refreshDrives, DRIVES_LIST_POLL_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshDrives();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const stats = useMemo(() => {
    const offersReceived = offers.filter((o) => o.status === "OFFERED").length;
    return {
      eligibleDrives: countEligibleDrives(drives, profile),
      applicationsSubmitted: applications.length,
      offersReceived
    };
  }, [applications.length, drives, offers, profile]);

  return {
    loading,
    error,
    refresh: load,
    user,
    profile,
    drives,
    featuredDrives,
    recommendedDrives,
    applications,
    rounds,
    offers,
    notifications,
    stats
  };
}
