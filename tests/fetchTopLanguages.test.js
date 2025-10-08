import { afterEach, describe, expect, it } from "@jest/globals";
import "@testing-library/jest-dom";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { fetchTopLanguages } from "../src/fetchers/top-languages.js";

const mock = new MockAdapter(axios);

afterEach(() => {
  mock.reset();
});

const data_langs = {
  data: {
    user: {
      repositories: {
        nodes: [
          {
            name: "test-repo-1",
            owner: {
              login: "anuraghazra",
            },
            languages: {
              edges: [{ size: 100, node: { color: "#0f0", name: "HTML" } }],
            },
          },
          {
            name: "test-repo-2",
            owner: {
              login: "anuraghazra",
            },
            languages: {
              edges: [{ size: 100, node: { color: "#0f0", name: "HTML" } }],
            },
          },
          {
            name: "test-repo-3",
            owner: {
              login: "anuraghazra",
            },
            languages: {
              edges: [
                { size: 100, node: { color: "#0ff", name: "javascript" } },
              ],
            },
          },
          {
            name: "test-repo-4",
            owner: {
              login: "anuraghazra",
            },
            languages: {
              edges: [
                { size: 100, node: { color: "#0ff", name: "javascript" } },
              ],
            },
          },
        ],
        pageInfo: {
          hasNextPage: false,
          endCursor: null,
        },
      },
    },
  },
};

const error = {
  errors: [
    {
      type: "NOT_FOUND",
      path: ["user"],
      locations: [],
      message: "Could not resolve to a User with the login of 'noname'.",
    },
  ],
};

describe("FetchTopLanguages", () => {
  it("should fetch correct language data while using the new calculation", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, data_langs);

    let repo = await fetchTopLanguages("anuraghazra", [], [], 0.5, 0.5);
    expect(repo).toStrictEqual({
      HTML: {
        color: "#0f0",
        count: 2,
        name: "HTML",
        size: 20.000000000000004,
      },
      javascript: {
        color: "#0ff",
        count: 2,
        name: "javascript",
        size: 20.000000000000004,
      },
    });
  });

  it("should fetch correct language data while excluding the 'test-repo-1' repository", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, data_langs);

    let repo = await fetchTopLanguages("anuraghazra", ["test-repo-1"], []);
    expect(repo).toStrictEqual({
      HTML: {
        color: "#0f0",
        count: 1,
        name: "HTML",
        size: 100,
      },
      javascript: {
        color: "#0ff",
        count: 2,
        name: "javascript",
        size: 200,
      },
    });
  });

  it("should fetch correct language data while using the old calculation", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, data_langs);

    let repo = await fetchTopLanguages("anuraghazra", [], [], 1, 0);
    expect(repo).toStrictEqual({
      HTML: {
        color: "#0f0",
        count: 2,
        name: "HTML",
        size: 200,
      },
      javascript: {
        color: "#0ff",
        count: 2,
        name: "javascript",
        size: 200,
      },
    });
  });

  it("should rank languages by the number of repositories they appear in", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, data_langs);

    let repo = await fetchTopLanguages("anuraghazra", [], [], 0, 1);
    expect(repo).toStrictEqual({
      HTML: {
        color: "#0f0",
        count: 2,
        name: "HTML",
        size: 2,
      },
      javascript: {
        color: "#0ff",
        count: 2,
        name: "javascript",
        size: 2,
      },
    });
  });

  it("should throw specific error when user not found", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, error);

    await expect(fetchTopLanguages("anuraghazra")).rejects.toThrow(
      "Could not resolve to a User with the login of 'noname'.",
    );
  });

  it("should throw other errors with their message", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, {
      errors: [{ message: "Some test GraphQL error" }],
    });

    await expect(fetchTopLanguages("anuraghazra")).rejects.toThrow(
      "Some test GraphQL error",
    );
  });

  it("should throw error with specific message when error does not contain message property", async () => {
    mock.onPost("https://api.github.com/graphql").reply(200, {
      errors: [{ type: "TEST" }],
    });

    await expect(fetchTopLanguages("anuraghazra")).rejects.toThrow(
      "Something went wrong while trying to retrieve the language data using the GraphQL API.",
    );
  });

  it("should fetch multiple pages when FETCH_MULTI_PAGE_STARS is enabled", async () => {
    // Store original env value
    const originalEnv = process.env.FETCH_MULTI_PAGE_STARS;
    process.env.FETCH_MULTI_PAGE_STARS = "true";

    // First page response
    const firstPageData = {
      data: {
        user: {
          repositories: {
            nodes: [
              {
                name: "test-repo-1",
                owner: {
                  login: "anuraghazra",
                },
                languages: {
                  edges: [{ size: 100, node: { color: "#0f0", name: "HTML" } }],
                },
              },
              {
                name: "test-repo-2",
                owner: {
                  login: "anuraghazra",
                },
                languages: {
                  edges: [
                    { size: 150, node: { color: "#0ff", name: "javascript" } },
                  ],
                },
              },
            ],
            pageInfo: {
              hasNextPage: true,
              endCursor: "cursor1",
            },
          },
        },
      },
    };

    // Second page response
    const secondPageData = {
      data: {
        user: {
          repositories: {
            nodes: [
              {
                name: "test-repo-3",
                owner: {
                  login: "anuraghazra",
                },
                languages: {
                  edges: [{ size: 200, node: { color: "#0f0", name: "HTML" } }],
                },
              },
              {
                name: "test-repo-4",
                owner: {
                  login: "anuraghazra",
                },
                languages: {
                  edges: [
                    { size: 250, node: { color: "#f00", name: "Python" } },
                  ],
                },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              endCursor: null,
            },
          },
        },
      },
    };

    // Mock the GraphQL API calls
    mock
      .onPost("https://api.github.com/graphql")
      .replyOnce(200, firstPageData)
      .onPost("https://api.github.com/graphql")
      .replyOnce(200, secondPageData);

    const repo = await fetchTopLanguages("anuraghazra", [], [], 1, 0);

    // Should combine data from both pages
    expect(repo).toStrictEqual({
      HTML: {
        color: "#0f0",
        count: 2,
        name: "HTML",
        size: 300, // 100 + 200
      },
      javascript: {
        color: "#0ff",
        count: 1,
        name: "javascript",
        size: 150,
      },
      Python: {
        color: "#f00",
        count: 1,
        name: "Python",
        size: 250,
      },
    });

    // Restore original env value
    if (originalEnv === undefined) {
      delete process.env.FETCH_MULTI_PAGE_STARS;
    } else {
      process.env.FETCH_MULTI_PAGE_STARS = originalEnv;
    }
  });

  it("should only fetch first page when FETCH_MULTI_PAGE_STARS is not enabled", async () => {
    // Ensure env variable is not set
    const originalEnv = process.env.FETCH_MULTI_PAGE_STARS;
    delete process.env.FETCH_MULTI_PAGE_STARS;

    const firstPageData = {
      data: {
        user: {
          repositories: {
            nodes: [
              {
                name: "test-repo-1",
                owner: {
                  login: "anuraghazra",
                },
                languages: {
                  edges: [{ size: 100, node: { color: "#0f0", name: "HTML" } }],
                },
              },
            ],
            pageInfo: {
              hasNextPage: true,
              endCursor: "cursor1",
            },
          },
        },
      },
    };

    // Mock should only be called once
    mock.onPost("https://api.github.com/graphql").replyOnce(200, firstPageData);

    const repo = await fetchTopLanguages("anuraghazra", [], [], 1, 0);

    // Should only have data from first page
    expect(repo).toStrictEqual({
      HTML: {
        color: "#0f0",
        count: 1,
        name: "HTML",
        size: 100,
      },
    });

    // Restore original env value
    if (originalEnv !== undefined) {
      process.env.FETCH_MULTI_PAGE_STARS = originalEnv;
    }
  });
});
