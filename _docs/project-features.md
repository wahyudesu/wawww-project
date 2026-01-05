# Project Features

## 👥 Group Management

| Feature             | Description                                          | Status         | Access         |
| ------------------- | ---------------------------------------------------- | -------------  |----------------|
| Tag All (`/tagall`) | Mention all group members except filtered numbers    | ✅ Implemented | Admin, Member  |
| Welcome Message     | Automatic welcome message for new group members      | ✅ Implemented | Admin, Member  |
| Group Join Handling | Process group join events and store participant data | ✅ Implemented |        -       |

## 🛡️ Content Moderation

| Feature              | Description                                      | Status        | Acc
| -------------------- | ------------------------------------------------ | ------------- |-------
| Toxic Word Detection | Detect and warn about toxic language in messages | ✅ Implemented | permanent

## 🎓 Educational Tools

| Feature              | Description                                          | Status        |
| -------------------- | ---------------------------------------------------- | ------------- |
| Math Quiz (`/math`)  | Generate and send math questions to groups           | ✅ Implemented |
| AI Assistant (`/ai`) | Answer questions using AI with context from database | ✅ Implemented |

## 🧰 Utility Commands

| Feature                             | Description                              | Status        |
| ----------------------------------- | ---------------------------------------- | ------------- |
| Greetings (`/pagi`, `/malam`, etc.) | Send predefined greeting messages        | ✅ Implemented |
| Pantun (`/pantun`)                  | Send random Indonesian pantun            | ✅ Implemented |
| Daily Prayers (`/doaharian`)        | Send random daily Islamic prayers        | ✅ Implemented |
| Bitcoin Price (`/bitcoin`)          | Fetch current Bitcoin prices (IDR & USD) | ✅ Implemented |
| Anime Search (`/anime`)             | Search anime info from MyAnimeList       | ✅ Implemented |
| Developer Info (`/dev`)             | Send developer info and usage terms      | ✅ Implemented |
| Help (`/help`)                      | Show list of available commands          | ✅ Implemented |

## 📱 Social Media

| Feature                                | Description                            | Status    |
| -------------------------------------- | -------------------------------------- | --------- |
| Instagram Downloader                   | Download Instagram content             | ⏳ Planned |
| TikTok / YouTube / Facebook Downloader | Download content from social platforms | ⏳ Planned |

## 📊 Analytics

| Feature                | Description                            | Status    |
| ---------------------- | -------------------------------------- | --------- |
| Chat Activity Tracking | Track and identify most active members | ⏳ Planned |

## 🎮 Gamification

| Feature             | Description                      | Status    |
| ------------------- | -------------------------------- | --------- |
| Quiz & Trivia Games | Interactive games for engagement | ⏳ Planned |

## 🛠️ Admin Tools

| Feature        | Description                     | Status     |
| -------------- | ------------------------------- | ---------  |
| Admin Controls | Kick, add members, close groups | ⏳ Planned |

## 🗄️ Database

| Feature               | Description            | Status     |
| --------------------- | ---------------------- | ---------  |
| Owner Data Collection | Store group owner data | ⏳ Planned |

## Notes:

1. ✅ Implemented: Feature is fully functional in the current codebase
2. ⏳ Planned: Feature is documented in requirements but not yet implemented
3. Features marked as "planned" are mentioned in `_docs/feature.md` but not found in the current implementation

## testing

(in private chat)
- [x] send text 
- [x] send image
- [x] send list interactive

(in group chat)
- [x] tagall
- [x] close and open group
- [x] kick and add person in group
- [ ] welcoming group

## command
- [x] /pagi, /siang, /malam #greetings
- [x] /tagall /mention all member in groups
- [x] /bitcoin
- [x] /doaharian
- [x] /pantun
- [x] /add /kick
- [x] /math, /math easy, /math medium, /math hard
- [x] /link
- [x] /set
- [x] /settings
- [x] /help
- [x] /anime
- [x] /dev
- [x] /ai

## handler
- [ ] link detecion -> ads detection
- [ ] toxic detection
- [ ] reminder sholat