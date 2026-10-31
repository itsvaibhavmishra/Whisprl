import packageJson from "#package.json" with { type: "json" };

// the release workflow reads this after a deploy, to know the commit it built is the one now answering; Northflank names it
export const getVersion = (req, res) => {
  res.json({ version: packageJson.version, commit: process.env.NF_DEPLOYMENT_SHA ?? null });
};
