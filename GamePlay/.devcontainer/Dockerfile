# Base: official devcontainer image with Node (uses Node 24 LTS)
FROM mcr.microsoft.com/devcontainers/javascript-node:24-bullseye

# Retry apt to be more resilient to transient failures
RUN echo 'Acquire::Retries "3";' > /etc/apt/apt.conf.d/80-retries

# Set non-interactive
ENV DEBIAN_FRONTEND=noninteractive
ENV LANG=C.UTF-8
ENV TZ=Europe/Paris
ENV NODE_ENV=development

# Update and install system deps required by canvas / jsdom / headless rendering
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     build-essential \
#     python3 \
#     python3-pip \
#     git \
#     curl \
#     ca-certificates \
#     pkg-config \
#     libcairo2-dev \
#     libpango1.0-dev \
#     libjpeg-dev \
#     libpng-dev \
#     libgif-dev \
#     librsvg2-dev \
#     libgl1-mesa-dev \
#     libxi-dev \
#     libnss3 \
#     libatk-bridge2.0-0 \
#     libxcomposite1 \
#     libxrandr2 \
#     libasound2 \
#     libxdamage1 \
#     libxkbcommon0 \
#     libgbm-dev \
#     libgtk-3-0 \
#     locales \
#     && rm -rf /var/lib/apt/lists/*

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    python3-pip \
    git \
    curl \
    wget \
    ca-certificates \
    pkg-config \
    node-gyp \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libpng-dev \
    libgif-dev \
    librsvg2-dev \
    libgl1-mesa-dev \
    libxi-dev \
    libnss3 \
    libatk-bridge2.0-0 \
    libxcomposite1 \
    libxrandr2 \
    libasound2 \
    libxdamage1 \
    libxkbcommon0 \
    libgbm-dev \
    libgtk-3-0 \
    libdrm-dev \
    libx11-dev \
    libxext-dev \
    locales \
    fonts-dejavu \
    fonts-liberation \
    fonts-noto-color-emoji \
    unzip \
    zip \
    && rm -rf /var/lib/apt/lists/*


# Create workspace dir and ensure node user owns it
WORKDIR /workspace
RUN mkdir -p /workspace && chown node:node /workspace

# Install globally useful node tools (pnpm, yarn, cross-env, angular cli, typescript compatible with Angular20)
# Note: typescript pinned to 5.8.x to be compatible with Angular 20
# RUN corepack enable && \
#     npm i -g pnpm@^10.0.0 yarn@^1.40.0 cross-env serve concurrently @angular/cli@^20.3.0 typescript@~5.8.3
RUN corepack enable && \
    npm i -g pnpm@^10.0.0 yarn cross-env serve concurrently @angular/cli@^20.3.0 typescript@~5.8.3 node-gyp prettier 
    #ngx-build-plus@20

# Install some global runtime libs useful for development (optional)
RUN npm i -g @hashgraph/sdk@^2.74.0 canvas

# Copy package files if present (this helps layer caching during builds)
# If your repository root contains package.json and workspace package files, they will be used to install deps now.
# This is intentionally permissive: if files are not present build continues.
# COPY package.json package-lock.json pnpm-lock.yaml* /workspace/ 2>/dev/null || true
# COPY ["package.json", "package-lock.json", "pnpm-lock.yaml*", "/workspace/"] 2>/dev/null || true
# COPY projects/client/package.json /workspace/projects/client/package.json 2>/dev/null || true
# COPY projects/server/package.json /workspace/projects/server/package.json 2>/dev/null || true
# COPY projects/shared/package.json /workspace/projects/shared/package.json 2>/dev/null || true
# Créer les répertoires
RUN mkdir -p /workspace/projects/client /workspace/projects/server /workspace/projects/shared

# Copier les fichiers principaux (s’ils existent)
COPY package*.json pnpm-lock.yaml* /workspace/

# Copier les package.json des sous-projets (si les dossiers existent)
COPY projects/client/package.json /workspace/projects/client/
COPY projects/server/package.json /workspace/projects/server/
COPY projects/shared/package.json /workspace/projects/shared/


# Install workspace dependencies if package.json present.
# Use pnpm (fast) when lockfile present, otherwise fallback to npm install
RUN if [ -f /workspace/pnpm-lock.yaml ]; then \
      pnpm install --frozen-lockfile --workspace-root || true; \
    elif [ -f /workspace/package.json ]; then \
      npm ci --no-audit --no-fund || true; \
    else \
      echo "No root package.json found — will install inside container at dev time." ; \
    fi

# Switch to non-root user (matches devcontainer default)
USER node

# Default shell
CMD ["bash"]
