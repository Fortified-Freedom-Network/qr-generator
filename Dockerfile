FROM node:22-alpine AS build
# PINNED. `pnpm@latest` is now 11.x; this repo's pnpm-lock.yaml is lockfileVersion 9.0. The drift
# broke the build outright: pnpm 10 turned "package has a build script" into a hard error
# (ERR_PNPM_IGNORED_BUILDS on sharp and unrs-resolver), so `pnpm install --frozen-lockfile` exits 1
# and no image has been published since 2026-03-24. Floating the package manager means the build
# silently changes underneath a pinned lockfile, which is the opposite of what the lockfile is for.
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Pinned, not floating. `nginx:alpine` is rebuilt often, but nothing rebuilds THIS image unless a
# commit lands, so the running container sat on Alpine 3.23.3 / openssl 3.5.5-r0 (CVE-2026-31789,
# CRITICAL) while the tag had long since moved on. A floating tag is also invisible to Renovate, so
# nothing ever proposed the bump. Pinning to the minor makes the drift visible and fixes the CVE.
FROM nginx:1.29-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/out /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
