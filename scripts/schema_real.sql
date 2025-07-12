CREATE TABLE IF NOT EXISTS devtools (
  id bigint PRIMARY KEY,
  account_login VARCHAR(100) NOT NULL,
  name VARCHAR(100) NOT NULL,
  avatar_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO devtools (id, account_login, name, avatar_url)
VALUES
  (65095814 , 'ellipsis-dev[bot]'        , 'ellipsis-dev[bot]'        , 'https://avatars.githubusercontent.com/in/64358?v=4'),
  (136622811, 'coderabbitai[bot]'        , 'coderabbitai[bot]'        , 'https://avatars.githubusercontent.com/in/347564?v=4'),
  (165735046, 'greptile-apps[bot]'       , 'greptile-apps[bot]'       , 'https://avatars.githubusercontent.com/in/867647?v=4'),
  (191113872, 'cubic-dev-ai[bot]'        , 'cubic-dev-ai[bot]'        , 'https://avatars.githubusercontent.com/in/1082092?v=4'),
  (189301087, 'windsurf-bot[bot]'        , 'windsurf-bot[bot]'        , 'https://avatars.githubusercontent.com/in/1066231?v=4'),
  (151058649, 'qodo-merge-pro[bot]'      , 'qodo-merge-pro[bot]'      , 'https://avatars.githubusercontent.com/in/484649?v=4'),
  (96075541 , 'graphite-app[bot]'        , 'graphite-app[bot]'        , 'https://avatars.githubusercontent.com/in/158384?v=4'),
  (206951365, 'cursor[bot]'              , 'cursor[bot]'              , 'https://avatars.githubusercontent.com/in/1210556?v=4'),
  (175728472, 'Copilot'                  , 'Copilot'                  , 'https://avatars.githubusercontent.com/in/946600?v=4');
  (151821869, 'codeant-ai[bot]'                  , 'CodeAnt'                  , 'https://avatars.githubusercontent.com/in/646884?v=4');


CREATE TABLE IF NOT EXISTS daily_metrics (
  date DATE PRIMARY KEY,
  total_active_repos INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tool_metrics (
  tool_id     bigint      NOT NULL REFERENCES devtools(id),
  record_day  date        NOT NULL,
  repo_count  integer     NOT NULL,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  PRIMARY KEY (record_day, tool_id)          -- most queries are on date
);