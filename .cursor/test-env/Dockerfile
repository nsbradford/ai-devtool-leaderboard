FROM ubuntu:24.04@sha256:80dd3c3b9c6cecb9f1667e9290b3bc61b78c2678c02cbdae5f0fea92cc6734ab

# Install system dependencies and development tools
RUN apt-get update && \
    apt-get install -y \
        curl \
        git \
        build-essential \
        python3 \
        python3-pip \
        ca-certificates \
        gnupg \
        lsb-release \
        sudo && \
    curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g pnpm && \
    ########################################################
    # DOCKER INSTALLATION
    ########################################################
    install -m 0755 -d /etc/apt/keyrings && \
    curl --retry 3 --retry-delay 5 -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg && \
    chmod a+r /etc/apt/keyrings/docker.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" \
      | tee /etc/apt/sources.list.d/docker.list > /dev/null && \
    apt-get update && \
    apt-get install -y \
      docker-ce=5:28.5.2-1~ubuntu.24.04~noble \
      docker-ce-cli=5:28.5.2-1~ubuntu.24.04~noble \
      containerd.io \
      docker-buildx-plugin \
      docker-compose-plugin && \
    # NOTE: workaround for docker-in-docker on kernels without full overlay2/nftables support.
    apt-get install -y fuse-overlayfs iptables && \
    mkdir -p /etc/docker && \
    printf '%s\n' '{' \
      '  "storage-driver": "fuse-overlayfs"' \
      '}' > /etc/docker/daemon.json && \
    update-alternatives --set iptables /usr/sbin/iptables-legacy && \
    update-alternatives --set ip6tables /usr/sbin/ip6tables-legacy && \
    # Create non-root user (only if it doesn't exist)
    id -u ubuntu &>/dev/null || useradd -m -s /bin/bash ubuntu && \
    # Create docker group if it doesn't exist and add ubuntu user to it
    groupadd -f docker && usermod -aG docker ubuntu && \
    usermod -aG sudo ubuntu && \
    # Configure passwordless sudo for ubuntu user
    echo "ubuntu ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/ubuntu && \
    chmod 0440 /etc/sudoers.d/ubuntu && \
    # Set a password for ubuntu user (not used by Cursor; keeps parity with typical dev images)
    echo "ubuntu:ubuntu" | chpasswd && \
    # Ensure no password authentication (only relevant if sshd is installed)
    mkdir -p /etc/ssh/sshd_config.d && \
    echo 'PasswordAuthentication no\nChallengeResponseAuthentication no\nUsePAM no' > /etc/ssh/sshd_config.d/disable_password_auth.conf && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

