FROM ubuntu:24.04@sha256:80dd3c3b9c6cecb9f1667e9290b3bc61b78c2678c02cbdae5f0fea92cc6734ab

# Install system dependencies and development tools
RUN apt-get update && \
    apt-get install -y \
        curl \
        git

RUN groupadd --gid 3000 cursor \
    && useradd --uid 2000 --gid cursor --create-home --shell /bin/bash cursor \
    && id cursor \
    && getent group cursor
    
USER cursor
WORKDIR /workspace

RUN echo "cursor_user_cursor_group" > /home/cursor/nick.txt
