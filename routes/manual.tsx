// Copyright 2022-2023 the Deno authors. All rights reserved. MIT license.

import { PageProps, RouteConfig } from "$fresh/server.ts";
import { Handlers } from "$fresh/server.ts";
import { ContentMeta } from "@/components/ContentMeta.tsx";
import { Header } from "@/components/Header.tsx";
import { Footer } from "$doc_components/footer.tsx";
import { Markdown } from "@/components/Markdown.tsx";
import * as Icons from "@/components/Icons.tsx";
import { ManualOrAPI, SidePanelPage } from "@/components/SidePanelPage.tsx";
import {
  generateToC,
  getDescription,
  getDocURL,
  getFileURL,
  getTableOfContents,
  isPreviewVersion,
  TableOfContents,
  versions,
} from "@/utils/manual_utils.ts";
import VersionSelect from "@/islands/VersionSelect.tsx";

import VERSIONS from "@/versions.json" assert { type: "json" };

interface Data {
  tableOfContents: TableOfContents;
  pageList: { path: string; name: string }[];
  content: string;
  version: string;
}

export default function Manual({ params, url, data }: PageProps<Data>) {
  const { version, pageList } = data;
  const path = `/${params.path}`;

  const pageIndex = pageList.findIndex((page) =>
    // page.path is in the form /manual@v{1.8.2}/{path}
    page.path.startsWith("/manual") && page.path.endsWith(path)
  );
  const sourceURL = getFileURL(version, path);

  const pageTitle =
    data.pageList.find((entry) => entry.path === url.pathname)?.name || "";

  const stdVersion = ((VERSIONS.cli_to_std as Record<string, string>)[
    version
  ]) ?? VERSIONS.std[0];

  const isPreview = isPreviewVersion(version);

  return (
    <>
      <ContentMeta
        title={pageTitle ? `${pageTitle} | Manual` : "Manual"}
        description={getDescription(data.content)}
        creator="@deno_land"
        ogType="article"
        ogImage="manual"
        keywords={[
          "deno",
          "manual",
          "documentation",
          "javascript",
          "typescript",
        ]}
      />
      <Header manual />

      <SidePanelPage
        sidepanel={
          <>
            <div class="sticky pr-[3rem] top-[4.5rem] -ml-0.5 h-[calc(100vh-4.5rem)] overflow-y-auto overflow-x-hidden py-16 pl-0.5">
              <div class="space-y-3 children:w-full mb-12">
                <ManualOrAPI current="Manual" version={version} />
                <VersionSelect
                  versions={Object.fromEntries(
                    versions.map((ver) => [ver, `/manual@${ver}${path}`]),
                  )}
                  selectedVersion={version}
                />
              </div>
              <ToC
                tableOfContents={data.tableOfContents}
                version={params.version}
                path={path}
              />
            </div>
          </>
        }
      >
        {isPreview && (
          <UserContributionBanner
            href={new URL(`/manual/${params.path}`, url).href}
          />
        )}
        <div class="w-full justify-self-center flex-shrink-1">
          <a
            href={getDocURL(version, path)}
            class="float-right py-2.5 px-4.5 rounded-md bg-grayDefault hover:bg-border leading-none font-medium"
          >
            Edit
          </a>

          <Markdown
            source={data.content
              .replace(/(\[.+\]\((?!https?:).+)\.md(\))/g, "$1$2")
              .replaceAll("$STD_VERSION", stdVersion)
              .replaceAll("$CLI_VERSION", version)}
            mediaBaseURL={sourceURL}
          />

          <div class="mt-14">
            {pageList[pageIndex - 1] && (
              <a
                href={pageList[pageIndex - 1].path}
                class="font-medium inline-flex items-center px-4.5 py-2.5 rounded-lg border border-border gap-1.5 hover:bg-grayDefault"
              >
                <Icons.ChevronLeft />
                <div>
                  {pageList[pageIndex - 1].name}
                </div>
              </a>
            )}
            {pageList[pageIndex + 1] && (
              <a
                href={pageList[pageIndex + 1].path}
                class="font-medium inline-flex items-center px-4.5 py-2.5 rounded-lg border border-border gap-1.5 hover:bg-grayDefault float-right text-right"
              >
                <div>
                  {pageList[pageIndex + 1].name}
                </div>
                <Icons.ChevronRight />
              </a>
            )}
          </div>
        </div>
      </SidePanelPage>
      <Footer />
    </>
  );
}

export function UserContributionBanner({
  href,
}: {
  href: string;
}) {
  return (
    <div class="bg-yellow-300 sticky top-0 rounded-md mb-6 py-4 px-3 sm:px-6 lg:px-8 font-medium text-gray-900">
      <span>
        You are viewing documentation generated from a{"  "}
        <b class="font-bold">user contribution</b>{"  "}
        or an upcoming release. The contents of this document may not have been
        reviewed by the Deno team.{" "}
      </span>

      <a class="underline cursor-pointer" href={href}>
        Click here to view the documentation for the latest release.
      </a>
    </div>
  );
}

function ToCEntry({
  slug,
  entry,
  version,
  path,
  outermost,
  depth,
}: {
  slug: string;
  entry: {
    name: string;
    children?: TableOfContents;
  } | string;
  version: string | undefined;
  path: string;
  outermost?: boolean;
  depth: number;
}) {
  const name = typeof entry === "string" ? entry : entry.name;
  const active = path === `/${slug}`;
  const hasChildren = typeof entry === "object" && entry.children;
  return (
    <li key={slug}>
      <a
        href={`/manual@${version}/${slug}`}
        class={`flex! items-center gap-2 relative text-sm ${
          outermost
            ? "font-display font-medium dark:text-white"
            : `pl-${depth * 6} pr-2.5 py-1 before:bg-sky-500`
        } rounded-md ${active ? "link font-semibold" : "hover:text-gray-500"} ${
          active
            ? "text-mainBlue"
            : outermost
            ? "text-gray-900"
            : "text-gray-500"
        }`}
      >
        {!outermost && active && (
          <div class="absolute left-0 top-1/2 w-1.5 h-1.5 -mt-0.5 -ml-1 rounded bg-mainBlue">
          </div>
        )}
        {name}
      </a>

      {hasChildren && (
        <ul class="font-normal nested mt-2 space-y-2 border-l-2 border-slate-100 dark:border-slate-800 lg:mt-4 lg:space-y-3 lg:border-slate-200">
          {Object.entries(entry.children!).map(([childSlug, entry]) => (
            <ToCEntry
              slug={`${slug}/${childSlug}`}
              entry={entry}
              version={version}
              path={path}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function ToC({
  tableOfContents,
  version,
  path,
}: {
  tableOfContents: TableOfContents;
  version: string | undefined;
  path: string;
}) {
  return (
    <nav>
      <ul class="list-inside font-semibold nested space-y-9">
        {Object.entries(tableOfContents).map(([slug, entry]) => (
          <ToCEntry
            slug={slug}
            entry={entry}
            version={version}
            path={path}
            outermost
            depth={0}
          />
        ))}
      </ul>
    </nav>
  );
}

export const handler: Handlers<Data> = {
  async GET(req, { params, render }) {
    const url = new URL(req.url);
    const { version, path } = params;
    if (!version || !path) {
      url.pathname = `/manual@${version || versions[0]}/${
        path || "introduction"
      }`;
      return Response.redirect(url);
    }
    if (url.pathname.endsWith(".md")) {
      url.pathname = url.pathname.slice(0, -3);
      return Response.redirect(url);
    }

    const sourceURL = getFileURL(version, `/${params.path}`);
    const [tableOfContents, content] = await Promise.all([
      getTableOfContents(version),
      fetch(sourceURL)
        .then(async (res) => {
          if (res.status === 404 || res.status === 403) {
            return "# 404 - Not Found\nWhoops, the page does not seem to exist.";
          } else if (res.status !== 200) {
            await res.body?.cancel();
            throw Error(
              `Got an error (${res.status}) while getting the documentation file (${sourceURL}).`,
            );
          }
          return res.text();
        })
        .catch((e) => {
          console.error("Failed to fetch content:", e);
          return "# 500 - Internal Server Error\nSomething went wrong.";
        }),
    ]);

    const { pageList, redirectList } = generateToC(
      tableOfContents,
      `/manual@${version}`,
    );

    const slashPath = "/" + params.path;
    if (slashPath in redirectList) {
      url.pathname = redirectList[slashPath];
      return Response.redirect(url, 301);
    }

    return render!({ tableOfContents, content, version, pageList });
  },
};

export const config: RouteConfig = {
  routeOverride: "/manual{@:version}?/:path*",
};
