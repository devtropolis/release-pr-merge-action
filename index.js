const core = require("@actions/core");
const { getOctokit, context } = require("@actions/github");

async function run() {
  const repo_token = core.getInput("repo-token");
  const github = getOctokit(repo_token);
  // Get informations from the context of the action
  const { owner, repo } = context.repo;
  const { title, body } = context.payload.pull_request;
  let releases;
  try {
    releases = await github.rest.repos.listReleases({
      owner,
      repo,
    });
  } catch (error) {
    console.error("An error occurred while listing releases");
    console.error(error);
  }
  let latestReleaseTag;
  if (releases.data.length === 0) {
    console.warn("No releases found");
    latestReleaseTag = "0.0.0";
  } else {
    latestReleaseTag = releases.data[0].tag_name;
  }
  const latestReleaseTagArray = latestReleaseTag.split(".");
  const majorVersion = latestReleaseTagArray[0];
  const minorVersion = Number(latestReleaseTagArray[1]);
  // Create the new release
  try {
    const createReleaseResponse = await github.rest.repos.createRelease({
      owner,
      repo,
      tag_name: `${majorVersion}.${minorVersion + 1}.0`,
      name: title,
      body: body ? body : "",
    });
    if(createReleaseResponse.status !== 201) {
      console.error("An error occurred while creating release");
      console.error(createReleaseResponse);
    }
  } catch (error) {
    console.error("An error occured while creating the release");
    console.error(error);
  }
}

run();
