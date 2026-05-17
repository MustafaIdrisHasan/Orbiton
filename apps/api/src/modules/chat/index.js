// Simple in-memory chat between COMPANY and TPO users.
// Room IDs are "company:<normalised-company-name>".
// TPO can access all rooms; a COMPANY user can only access their own room.

const express = require("express");
const { recruiterStore } = require("../recruiters/mockData");
const profileStore = require("../companies/profileStore");
const { ROLES } = require("../../core/constants/roles");

const router = express.Router();

function normalizeName(v) {
  return String(v || "").trim().toLowerCase().replace(/\s+/g, "-");
}

function roomIdForCompany(name) {
  return `company:${normalizeName(name)}`;
}

function getUserRoom(req) {
  const role = req.user?.role || (req.user?.roles || [])[0] || "";
  const userId = req.user?.userId || req.user?.id;
  const email = req.user?.email || "";

  if (String(role).toUpperCase() === ROLES.COMPANY) {
    const profile = profileStore.getProfile(userId) || profileStore.upsertProfile(userId, { email });
    if (!profile.companyName) return null;
    return roomIdForCompany(profile.companyName);
  }
  return null; // TPO/ADMIN can access any room
}

function isTpoOrAdmin(req) {
  const role = String(req.user?.role || (req.user?.roles || [])[0] || "").toUpperCase();
  return role === ROLES.TPO || role === ROLES.ADMIN;
}

function isCompany(req) {
  const role = String(req.user?.role || (req.user?.roles || [])[0] || "").toUpperCase();
  return role === ROLES.COMPANY;
}

/** GET /api/v1/chat/rooms — list rooms visible to the caller. */
router.get("/rooms", (req, res) => {
  const rooms = Object.keys(recruiterStore.chatMessages).map((roomId) => {
    const msgs = recruiterStore.chatMessages[roomId] || [];
    const last = msgs[msgs.length - 1] || null;
    const label = roomId.startsWith("company:")
      ? roomId.slice("company:".length).replace(/-/g, " ")
      : roomId;
    return {
      roomId,
      label: label.replace(/\b\w/g, (c) => c.toUpperCase()),
      messageCount: msgs.length,
      lastMessage: last ? { from: last.fromName, text: last.message, sentAt: last.sentAt } : null
    };
  });

  if (isTpoOrAdmin(req)) {
    res.json({ rooms });
    return;
  }

  const myRoom = getUserRoom(req);
  if (!myRoom) {
    res.json({ rooms: [] });
    return;
  }
  res.json({ rooms: rooms.filter((r) => r.roomId === myRoom) });
});

/** GET /api/v1/chat/rooms/:roomId/messages */
router.get("/rooms/:roomId/messages", (req, res) => {
  const { roomId } = req.params;

  if (isCompany(req)) {
    const myRoom = getUserRoom(req);
    if (!myRoom || myRoom !== roomId) {
      res.status(403).json({ message: "You can only access your own company chat room" });
      return;
    }
  }

  const messages = recruiterStore.chatMessages[roomId] || [];
  res.json({ roomId, messages });
});

/** POST /api/v1/chat/rooms/:roomId/messages  Body: { message } */
router.post("/rooms/:roomId/messages", (req, res) => {
  const { roomId } = req.params;
  const { message } = req.body || {};

  if (!message || !String(message).trim()) {
    res.status(400).json({ message: "message is required" });
    return;
  }

  if (isCompany(req)) {
    const myRoom = getUserRoom(req);
    if (!myRoom || myRoom !== roomId) {
      res.status(403).json({ message: "You can only post in your own company chat room" });
      return;
    }
  } else if (!isTpoOrAdmin(req)) {
    res.status(403).json({ message: "Only TPO or Company users can chat" });
    return;
  }

  const role = String(req.user?.role || (req.user?.roles || [])[0] || "").toUpperCase();
  const email = req.user?.email || "";
  const fromName = email.split("@")[0] || role;

  if (!recruiterStore.chatMessages[roomId]) {
    recruiterStore.chatMessages[roomId] = [];
  }

  const msg = {
    id: `chat-${Date.now()}-${Math.floor(Math.random() * 1e5)}`,
    roomId,
    from: email,
    fromRole: role,
    fromName,
    message: String(message).trim(),
    sentAt: new Date().toISOString()
  };
  recruiterStore.chatMessages[roomId].push(msg);

  res.status(201).json({ ok: true, message: msg });
});

/** POST /api/v1/chat/rooms — company creates/ensures their room exists */
router.post("/rooms", (req, res) => {
  if (!isCompany(req) && !isTpoOrAdmin(req)) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }
  const myRoom = getUserRoom(req);
  if (!myRoom) {
    res.status(400).json({ message: "Set your company name first" });
    return;
  }
  if (!recruiterStore.chatMessages[myRoom]) {
    recruiterStore.chatMessages[myRoom] = [];
  }
  res.json({ roomId: myRoom });
});

module.exports = router;
