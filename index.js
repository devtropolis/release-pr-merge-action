const core = require("@actions/core");
const { getOctokit, context } = require("@actions/github");

async function run() {
  const repo_token = core.getInput("repo-token");
  const github = getOctokit(repo_token);
  // Get informations from the context of the action
  const { owner, repo } = context.repo;
  const { title, body, number } = context.payload.pull_request;
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
  let tags;
  let tagString = " tags: "
  try {
    tags = await github.rest.issues.listLabelsOnIssue({
      owner,
      repo,
      number,
    });
    tagString = tags.reduce((prev, tag, index) => prev + tag.name + (index !== tags.length - 1 ? ', ' : '', tagString));
  } catch (error) {
    console.error("An error occurred while listing tags");
    console.error(error);
  }

  try {
    const createReleaseResponse = await github.rest.repos.createRelease({
      owner,
      repo,
      tag_name: getNewVersion(latestReleaseTag),
      name: title,
      body: body ? body + '\r\n' + tagString : "",
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

function getNewVersion(version) {
  let splitVersions = version.split('.');
  for (let splitVersionIndex = 2; splitVersionIndex >= 0; splitVersionIndex--) {
    if (splitVersionIndex === 2) {
     splitVersions[splitVersionIndex]++;
    }
    if (splitVersions[splitVersionIndex] > 99 && splitVersionIndex !== 0) {
     splitVersions[splitVersionIndex] = 0;
     if (splitVersions[splitVersionIndex - 1] !== undefined) {
      splitVersions[splitVersionIndex - 1]++;
     }
    }
  }
  return splitVersions.join(".");
}

run();
