const whitelist = process.env.WHITELIST
  ? process.env.WHITELIST.split(",")
  : undefined;

const gistWhitelist = process.env.GIST_WHITELIST
  ? process.env.GIST_WHITELIST.split(",")
  : undefined;

const excludeRepositories = process.env.EXCLUDE_REPO
  ? process.env.EXCLUDE_REPO.split(",")
  : [];

const excludeOwner = process.env.EXCLUDE_OWNER
  ? process.env.EXCLUDE_OWNER.split(",")
  : [];

export { whitelist, gistWhitelist, excludeRepositories, excludeOwner };
