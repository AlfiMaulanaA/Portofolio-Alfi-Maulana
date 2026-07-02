import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GITHUB_LOGIN = "AlfiMaulanaA";

const query = `
  query PortfolioGitHub($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      name
      login
      bio
      avatarUrl
      location
      websiteUrl
      url
      repositories(first: 100, ownerAffiliations: OWNER, privacy: PUBLIC, orderBy: { field: UPDATED_AT, direction: DESC }) {
        nodes {
          name
          description
          primaryLanguage {
            name
          }
          stargazerCount
          forkCount
          url
          updatedAt
        }
      }
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        totalPullRequestReviewContributions
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
              contributionLevel
              color
            }
          }
        }
      }
    }
  }
`;

export async function GET() {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    return NextResponse.json(
      { error: "GITHUB_TOKEN is not configured" },
      { status: 503 },
    );
  }

  const year = new Date().getFullYear();
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: {
        login: GITHUB_LOGIN,
        from: `${year}-01-01T00:00:00Z`,
        to: `${year}-12-31T23:59:59Z`,
      },
    }),
    cache: "no-store",
  });

  const payload = await response.json();

  if (!response.ok || payload.errors) {
    return NextResponse.json(
      {
        error: "Failed to fetch GitHub GraphQL data",
        details: payload.errors ?? payload.message,
      },
      { status: response.status || 500 },
    );
  }

  const user = payload.data.user;
  const collection = user.contributionsCollection;
  const calendar = collection.contributionCalendar;
  const days = calendar.weeks.flatMap((week: any) => week.contributionDays);

  return NextResponse.json({
    profile: {
      name: user.name,
      username: user.login,
      bio: user.bio,
      avatar: user.avatarUrl,
      location: user.location,
      website: user.websiteUrl,
      url: user.url,
    },
    repositories: user.repositories.nodes.map((repo: any) => ({
      name: repo.name,
      description: repo.description,
      language: repo.primaryLanguage?.name ?? "Unknown",
      stars: repo.stargazerCount,
      forks: repo.forkCount,
      url: repo.url,
      updatedAt: repo.updatedAt,
    })),
    contributions: {
      year,
      total: calendar.totalContributions,
      commits: collection.totalCommitContributions,
      pullRequests: collection.totalPullRequestContributions,
      issues: collection.totalIssueContributions,
      reviews: collection.totalPullRequestReviewContributions,
      calendar: days.map((day: any) => ({
        date: day.date,
        count: day.contributionCount,
        level: day.contributionLevel,
        color: day.color,
      })),
    },
  });
}
