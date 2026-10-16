# EDU-Track for MPSPS College (frontend only)

No installation and no server needed.

## Open it
1. Unzip this folder.
2. Double-click **index.html** (best in Google Chrome or Microsoft Edge).

Everything works inside the browser and data is saved in that browser.
If you use Firefox and the login does not carry over between pages, open the folder with the "Live Server" extension in VS Code instead, or use Chrome / Edge.

## Demo accounts
Choose the course / department / section first, then log in.

| Login    | Choose first                     | ID          | Password   |
|----------|----------------------------------|-------------|------------|
| Student  | BCA                              | BCA24001    | student123 |
| Teacher  | Computer Applications            | TCH101      | teacher123 |
| Staff    | Administration Office            | STF101      | staff123   |

More students: BCA24002 to BCA24008, BCOM24001, BBA24001, BSC24001, BA24001 (course must match).
More teachers: TCH102 to TCH115. More staff: STF102 to STF105.
Each login page has a "Fill demo details" button and a "Reset demo data" button.

## Camera
"Open camera" needs your permission. If the camera will not open, use **Upload** (on a phone it opens the camera).
A photo taken on the login page becomes your ID card photo and marks attendance for the day.

## Change the upcoming events
Open **js/events.js** in any text editor. Edit, add or delete items in the list at the top
(NSS, sports, cultural, committee). Use a fixed date like `date: '2026-11-14'`.

## Files
- index.html: front page with upcoming events
- login-student.html, login-teacher.html, login-staff.html
- student.html, teacher.html, staff.html: dashboards
- css/: styles   js/: scripts (js/localserver.js is the built-in data engine)

Note: because there is no real server, this version is for demos and testing. For real use with many people, the data needs a proper backend.
