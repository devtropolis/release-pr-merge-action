import { core } from "@actions/core";
import { getOctokit, context } from "@actions/github";

async function run() {
  const repo_token = core.getInput("repo-token");
  const github = getOctokit(repo_token);
  // Get informations from the context of the action
  const { owner, repo } = context.repo;
  const { title, body, number } = context.payload.pull_request;

  let release;

  try {
    release = await github.rest.repos.getLatestRelease({
      owner,
      repo,
    });
  } catch (error) {
    console.error("An error occurred while listing releases");
    console.error(error);
    core.setFailed(error.message);
    return;
  }

  console.info("Found Latest Release", { releaseResponse: release });

  let labels = null;
  let labelString = " labels: "

  try {
    labels = await github.rest.issues.listLabelsOnIssue({
      owner,
      repo,
      issue_number: number,
    })
  } catch (error) {
    console.error("An error occurred while listing labels");
    console.error(error);
  }

  if (labels?.status === 200) {
    console.info("Found Release Labels", { labelsResponse: labels });

    labelString = labels.data.reduce((prev, label, index) => prev + label.name + (index !== labels.length - 1 ? ', ' : ''), labelString);

    console.info("Label String", { string: labelString });
  }

  try {
    const createReleaseResponse = await github.rest.repos.createRelease({
      owner,
      repo,
      tag_name: getNewVersion(latestReleaseTag),
      name: title,
      body: body ? body + '\r\n' + labelString : "" + '\r\n' + labelString,
      make_latest: true,
    });
    if (createReleaseResponse.status !== 201) {
      console.error("An error occurred while creating release");
      console.error(createReleaseResponse);
      core.setFailed(error.message);
      return;
    }
  } catch (error) {
    console.error("An error occured while creating the release");
    console.error(error);
    core.setFailed(error.message);
    return;
  }

  console.info('Created New Release', { response: createReleaseResponse });
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
