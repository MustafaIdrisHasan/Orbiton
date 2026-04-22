const { authService } = require("./auth.service");

async function main() {
  const result = await authService.seedDefaultUsers();
  // eslint-disable-next-line no-console
  console.log(`Seeded ${result.seededUsers.length} auth users`);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  });
