/**
 * Complete lookup table for Perfect Plus™ PzS and PzB cells.
 * Source: EnerSys Perfect Plus Technical Data Sheet (EMEA-EN-TD-HAW-PP-0524)
 *
 * Key format (normalised, uppercase): "{plates} PZ{S|B} {Ah}" or "{plates} PZ{S|B} {Ah} 4P"
 *
 * Dimensions (as labelled on the physical cell):
 *   widthMm   – 198 mm (PzS) | 158 mm (PzB)  ← FIXED per series
 *   lengthMm  – varies by plate count          ← plate-count dimension
 *   heightMm  – overall height (varies by Ah)
 *   weightKg  – weight ±5% with electrolyte (kg)
 */
const CELL_TABLE = {
  // ─── PzS — Serie L (width = 198 mm) ─────────────────────────
  // height 370
  '2 PZS 120':  { capacityAh:120,  widthMm:198, lengthMm:47,  heightMm:370, weightKg:8.5,  variant:'PzS', plates:2,  is4P:false },
  '3 PZS 180':  { capacityAh:180,  widthMm:198, lengthMm:65,  heightMm:370, weightKg:12.0, variant:'PzS', plates:3,  is4P:false },
  '4 PZS 240':  { capacityAh:240,  widthMm:198, lengthMm:83,  heightMm:370, weightKg:15.4, variant:'PzS', plates:4,  is4P:false },
  '5 PZS 250':  { capacityAh:250,  widthMm:197, lengthMm:102, heightMm:313, weightKg:16.1, variant:'PzS', plates:5,  is4P:false },
  '5 PZS 300':  { capacityAh:300,  widthMm:198, lengthMm:101, heightMm:370, weightKg:19.0, variant:'PzS', plates:5,  is4P:false },
  '6 PZS 360':  { capacityAh:360,  widthMm:198, lengthMm:119, heightMm:370, weightKg:22.5, variant:'PzS', plates:6,  is4P:false },
  '7 PZS 420':  { capacityAh:420,  widthMm:198, lengthMm:137, heightMm:370, weightKg:26.0, variant:'PzS', plates:7,  is4P:false },
  '8 PZS 480':  { capacityAh:480,  widthMm:198, lengthMm:155, heightMm:370, weightKg:29.5, variant:'PzS', plates:8,  is4P:false },
  '9 PZS 540':  { capacityAh:540,  widthMm:198, lengthMm:174, heightMm:370, weightKg:33.0, variant:'PzS', plates:9,  is4P:false },
  '10 PZS 600': { capacityAh:600,  widthMm:198, lengthMm:192, heightMm:370, weightKg:36.5, variant:'PzS', plates:10, is4P:false },
  // height 435
  '2 PZS 160':  { capacityAh:160,  widthMm:198, lengthMm:47,  heightMm:435, weightKg:10.0, variant:'PzS', plates:2,  is4P:false },
  '3 PZS 240':  { capacityAh:240,  widthMm:198, lengthMm:65,  heightMm:435, weightKg:14.2, variant:'PzS', plates:3,  is4P:false },
  '4 PZS 320':  { capacityAh:320,  widthMm:198, lengthMm:83,  heightMm:435, weightKg:18.4, variant:'PzS', plates:4,  is4P:false },
  '5 PZS 400':  { capacityAh:400,  widthMm:198, lengthMm:101, heightMm:435, weightKg:22.6, variant:'PzS', plates:5,  is4P:false },
  '6 PZS 480':  { capacityAh:480,  widthMm:198, lengthMm:119, heightMm:435, weightKg:26.7, variant:'PzS', plates:6,  is4P:false },
  '7 PZS 560':  { capacityAh:560,  widthMm:198, lengthMm:137, heightMm:435, weightKg:31.3, variant:'PzS', plates:7,  is4P:false },
  '8 PZS 640':  { capacityAh:640,  widthMm:198, lengthMm:155, heightMm:435, weightKg:35.1, variant:'PzS', plates:8,  is4P:false },
  '9 PZS 720':  { capacityAh:720,  widthMm:198, lengthMm:174, heightMm:435, weightKg:39.3, variant:'PzS', plates:9,  is4P:false },
  '10 PZS 800': { capacityAh:800,  widthMm:198, lengthMm:192, heightMm:435, weightKg:43.4, variant:'PzS', plates:10, is4P:false },
  // height 505
  '2 PZS 180':  { capacityAh:180,  widthMm:198, lengthMm:47,  heightMm:505, weightKg:11.9, variant:'PzS', plates:2,  is4P:false },
  '3 PZS 270':  { capacityAh:270,  widthMm:198, lengthMm:65,  heightMm:505, weightKg:17.0, variant:'PzS', plates:3,  is4P:false },
  '4 PZS 360':  { capacityAh:360,  widthMm:198, lengthMm:83,  heightMm:505, weightKg:22.1, variant:'PzS', plates:4,  is4P:false },
  '5 PZS 450':  { capacityAh:450,  widthMm:198, lengthMm:101, heightMm:505, weightKg:27.1, variant:'PzS', plates:5,  is4P:false },
  '6 PZS 540':  { capacityAh:540,  widthMm:198, lengthMm:119, heightMm:505, weightKg:32.2, variant:'PzS', plates:6,  is4P:false },
  '7 PZS 630':  { capacityAh:630,  widthMm:198, lengthMm:137, heightMm:505, weightKg:37.2, variant:'PzS', plates:7,  is4P:false },
  '8 PZS 720':  { capacityAh:720,  widthMm:198, lengthMm:155, heightMm:505, weightKg:42.3, variant:'PzS', plates:8,  is4P:false },
  '9 PZS 810':  { capacityAh:810,  widthMm:198, lengthMm:174, heightMm:505, weightKg:47.4, variant:'PzS', plates:9,  is4P:false },
  '10 PZS 900': { capacityAh:900,  widthMm:198, lengthMm:192, heightMm:505, weightKg:52.4, variant:'PzS', plates:10, is4P:false },
  // height 541
  '2 PZS 210':      { capacityAh:210,  widthMm:198, lengthMm:47,  heightMm:541, weightKg:13.5, variant:'PzS', plates:2,  is4P:false },
  '3 PZS 315':      { capacityAh:315,  widthMm:198, lengthMm:65,  heightMm:541, weightKg:19.1, variant:'PzS', plates:3,  is4P:false },
  '4 PZS 420':      { capacityAh:420,  widthMm:198, lengthMm:83,  heightMm:541, weightKg:24.6, variant:'PzS', plates:4,  is4P:false },
  '5 PZS 525':      { capacityAh:525,  widthMm:198, lengthMm:101, heightMm:541, weightKg:30.5, variant:'PzS', plates:5,  is4P:false },
  '6 PZS 630':      { capacityAh:630,  widthMm:198, lengthMm:119, heightMm:541, weightKg:36.1, variant:'PzS', plates:6,  is4P:false },
  '7 PZS 735':      { capacityAh:735,  widthMm:198, lengthMm:137, heightMm:541, weightKg:41.8, variant:'PzS', plates:7,  is4P:false },
  '8 PZS 840':      { capacityAh:840,  widthMm:198, lengthMm:155, heightMm:541, weightKg:47.4, variant:'PzS', plates:8,  is4P:false },
  '9 PZS 945':      { capacityAh:945,  widthMm:198, lengthMm:174, heightMm:541, weightKg:53.1, variant:'PzS', plates:9,  is4P:false },
  '10 PZS 1050':    { capacityAh:1050, widthMm:198, lengthMm:192, heightMm:541, weightKg:58.4, variant:'PzS', plates:10, is4P:false },
  '12 PZS 1260 4P': { capacityAh:1260, widthMm:198, lengthMm:227, heightMm:541, weightKg:65.9, variant:'PzS', plates:12, is4P:true },
  // height 575
  '2 PZS 230':      { capacityAh:230,  widthMm:198, lengthMm:47,  heightMm:575, weightKg:14.2, variant:'PzS', plates:2,  is4P:false },
  '3 PZS 345':      { capacityAh:345,  widthMm:198, lengthMm:65,  heightMm:575, weightKg:20.3, variant:'PzS', plates:3,  is4P:false },
  '4 PZS 460':      { capacityAh:460,  widthMm:198, lengthMm:83,  heightMm:575, weightKg:26.4, variant:'PzS', plates:4,  is4P:false },
  '5 PZS 575':      { capacityAh:575,  widthMm:198, lengthMm:101, heightMm:575, weightKg:32.4, variant:'PzS', plates:5,  is4P:false },
  '6 PZS 690':      { capacityAh:690,  widthMm:198, lengthMm:119, heightMm:575, weightKg:39.0, variant:'PzS', plates:6,  is4P:false },
  '7 PZS 805':      { capacityAh:805,  widthMm:198, lengthMm:137, heightMm:575, weightKg:44.7, variant:'PzS', plates:7,  is4P:false },
  '8 PZS 920':      { capacityAh:920,  widthMm:198, lengthMm:155, heightMm:575, weightKg:50.6, variant:'PzS', plates:8,  is4P:false },
  '9 PZS 1035':     { capacityAh:1035, widthMm:198, lengthMm:174, heightMm:575, weightKg:56.6, variant:'PzS', plates:9,  is4P:false },
  '10 PZS 1150':    { capacityAh:1150, widthMm:198, lengthMm:192, heightMm:575, weightKg:62.7, variant:'PzS', plates:10, is4P:false },
  '12 PZS 1380 4P': { capacityAh:1380, widthMm:198, lengthMm:227, heightMm:575, weightKg:73.3, variant:'PzS', plates:12, is4P:true },
  // height 600
  '2 PZS 250':      { capacityAh:250,  widthMm:198, lengthMm:47,  heightMm:600, weightKg:15.0, variant:'PzS', plates:2,  is4P:false },
  '3 PZS 375':      { capacityAh:375,  widthMm:198, lengthMm:65,  heightMm:600, weightKg:21.2, variant:'PzS', plates:3,  is4P:false },
  '4 PZS 500':      { capacityAh:500,  widthMm:198, lengthMm:83,  heightMm:600, weightKg:27.4, variant:'PzS', plates:4,  is4P:false },
  '5 PZS 625':      { capacityAh:625,  widthMm:198, lengthMm:101, heightMm:600, weightKg:33.9, variant:'PzS', plates:5,  is4P:false },
  '6 PZS 750':      { capacityAh:750,  widthMm:198, lengthMm:119, heightMm:600, weightKg:40.3, variant:'PzS', plates:6,  is4P:false },
  '7 PZS 875':      { capacityAh:875,  widthMm:198, lengthMm:137, heightMm:600, weightKg:46.5, variant:'PzS', plates:7,  is4P:false },
  '8 PZS 1000':     { capacityAh:1000, widthMm:198, lengthMm:155, heightMm:600, weightKg:53.1, variant:'PzS', plates:8,  is4P:false },
  '9 PZS 1125':     { capacityAh:1125, widthMm:198, lengthMm:174, heightMm:600, weightKg:59.4, variant:'PzS', plates:9,  is4P:false },
  '10 PZS 1250':    { capacityAh:1250, widthMm:198, lengthMm:192, heightMm:600, weightKg:66.0, variant:'PzS', plates:10, is4P:false },
  '10 PZS 1250 4P': { capacityAh:1250, widthMm:198, lengthMm:192, heightMm:600, weightKg:66.0, variant:'PzS', plates:10, is4P:true },
  '12 PZS 1500 4P': { capacityAh:1500, widthMm:198, lengthMm:227, heightMm:600, weightKg:77.0, variant:'PzS', plates:12, is4P:true },
  // height 715
  '2 PZS 280':      { capacityAh:280,  widthMm:198, lengthMm:47,  heightMm:715, weightKg:17.5, variant:'PzS', plates:2,  is4P:false },
  '3 PZS 420':      { capacityAh:420,  widthMm:198, lengthMm:65,  heightMm:715, weightKg:24.7, variant:'PzS', plates:3,  is4P:false },
  '4 PZS 560':      { capacityAh:560,  widthMm:198, lengthMm:83,  heightMm:715, weightKg:31.8, variant:'PzS', plates:4,  is4P:false },
  '5 PZS 700':      { capacityAh:700,  widthMm:198, lengthMm:101, heightMm:715, weightKg:39.3, variant:'PzS', plates:5,  is4P:false },
  '6 PZS 840':      { capacityAh:840,  widthMm:198, lengthMm:119, heightMm:715, weightKg:46.7, variant:'PzS', plates:6,  is4P:false },
  '7 PZS 980':      { capacityAh:980,  widthMm:198, lengthMm:137, heightMm:715, weightKg:53.9, variant:'PzS', plates:7,  is4P:false },
  '8 PZS 1120':     { capacityAh:1120, widthMm:198, lengthMm:155, heightMm:715, weightKg:61.3, variant:'PzS', plates:8,  is4P:false },
  '9 PZS 1260':     { capacityAh:1260, widthMm:198, lengthMm:174, heightMm:715, weightKg:68.6, variant:'PzS', plates:9,  is4P:false },
  '9 PZS 1260 4P':  { capacityAh:1260, widthMm:198, lengthMm:174, heightMm:715, weightKg:68.6, variant:'PzS', plates:9,  is4P:true },
  '10 PZS 1400':    { capacityAh:1400, widthMm:198, lengthMm:192, heightMm:715, weightKg:76.0, variant:'PzS', plates:10, is4P:false },
  '10 PZS 1400 4P': { capacityAh:1400, widthMm:198, lengthMm:192, heightMm:715, weightKg:76.0, variant:'PzS', plates:10, is4P:true },
  '12 PZS 1680 4P': { capacityAh:1680, widthMm:198, lengthMm:227, heightMm:715, weightKg:89.3, variant:'PzS', plates:12, is4P:true },
  // height 750
  '2 PZS 310':      { capacityAh:310,  widthMm:198, lengthMm:47,  heightMm:750, weightKg:18.9, variant:'PzS', plates:2,  is4P:false },
  '3 PZS 465':      { capacityAh:465,  widthMm:198, lengthMm:65,  heightMm:750, weightKg:26.7, variant:'PzS', plates:3,  is4P:false },
  '4 PZS 620':      { capacityAh:620,  widthMm:198, lengthMm:83,  heightMm:750, weightKg:34.6, variant:'PzS', plates:4,  is4P:false },
  '5 PZS 775':      { capacityAh:775,  widthMm:198, lengthMm:101, heightMm:750, weightKg:42.6, variant:'PzS', plates:5,  is4P:false },
  '6 PZS 930':      { capacityAh:930,  widthMm:198, lengthMm:119, heightMm:750, weightKg:50.5, variant:'PzS', plates:6,  is4P:false },
  '7 PZS 1085':     { capacityAh:1085, widthMm:198, lengthMm:137, heightMm:750, weightKg:58.5, variant:'PzS', plates:7,  is4P:false },
  '8 PZS 1240':     { capacityAh:1240, widthMm:198, lengthMm:155, heightMm:750, weightKg:66.4, variant:'PzS', plates:8,  is4P:false },
  '8 PZS 1240 4P':  { capacityAh:1240, widthMm:198, lengthMm:155, heightMm:750, weightKg:66.4, variant:'PzS', plates:8,  is4P:true },
  '9 PZS 1395':     { capacityAh:1395, widthMm:198, lengthMm:174, heightMm:750, weightKg:74.4, variant:'PzS', plates:9,  is4P:false },
  '9 PZS 1395 4P':  { capacityAh:1395, widthMm:198, lengthMm:174, heightMm:750, weightKg:74.4, variant:'PzS', plates:9,  is4P:true },
  '10 PZS 1550':    { capacityAh:1550, widthMm:198, lengthMm:192, heightMm:750, weightKg:82.4, variant:'PzS', plates:10, is4P:false },
  '10 PZS 1550 4P': { capacityAh:1550, widthMm:198, lengthMm:192, heightMm:750, weightKg:82.4, variant:'PzS', plates:10, is4P:true },
  '12 PZS 1860 4P': { capacityAh:1860, widthMm:198, lengthMm:227, heightMm:750, weightKg:94.2, variant:'PzS', plates:12, is4P:true },

  // ─── PzB — Serie E (width = 158 mm) ─────────────────────────
  // height 230
  '2 PZB 46':  { capacityAh:46,  widthMm:158, lengthMm:45,  heightMm:230, weightKg:4.1,  variant:'PzB', plates:2,  is4P:false },
  '3 PZB 69':  { capacityAh:69,  widthMm:158, lengthMm:61,  heightMm:230, weightKg:5.6,  variant:'PzB', plates:3,  is4P:false },
  '4 PZB 92':  { capacityAh:92,  widthMm:158, lengthMm:77,  heightMm:230, weightKg:7.0,  variant:'PzB', plates:4,  is4P:false },
  '5 PZB 115': { capacityAh:115, widthMm:158, lengthMm:93,  heightMm:230, weightKg:8.5,  variant:'PzB', plates:5,  is4P:false },
  '6 PZB 138': { capacityAh:138, widthMm:158, lengthMm:109, heightMm:230, weightKg:10.0, variant:'PzB', plates:6,  is4P:false },
  // height 292
  '2 PZB 64':  { capacityAh:64,  widthMm:158, lengthMm:45,  heightMm:292, weightKg:5.0,  variant:'PzB', plates:2,  is4P:false },
  '3 PZB 96':  { capacityAh:96,  widthMm:158, lengthMm:61,  heightMm:292, weightKg:6.8,  variant:'PzB', plates:3,  is4P:false },
  '4 PZB 128': { capacityAh:128, widthMm:158, lengthMm:77,  heightMm:292, weightKg:8.7,  variant:'PzB', plates:4,  is4P:false },
  '5 PZB 160': { capacityAh:160, widthMm:158, lengthMm:93,  heightMm:292, weightKg:10.6, variant:'PzB', plates:5,  is4P:false },
  '6 PZB 192': { capacityAh:192, widthMm:158, lengthMm:109, heightMm:292, weightKg:12.5, variant:'PzB', plates:6,  is4P:false },
  '7 PZB 224': { capacityAh:224, widthMm:158, lengthMm:125, heightMm:292, weightKg:14.4, variant:'PzB', plates:7,  is4P:false },
  '8 PZB 256': { capacityAh:256, widthMm:158, lengthMm:141, heightMm:292, weightKg:16.2, variant:'PzB', plates:8,  is4P:false },
  // height 358
  '2 PZB 84':  { capacityAh:84,  widthMm:158, lengthMm:45,  heightMm:358, weightKg:6.5,  variant:'PzB', plates:2,  is4P:false },
  '3 PZB 126': { capacityAh:126, widthMm:158, lengthMm:61,  heightMm:358, weightKg:8.9,  variant:'PzB', plates:3,  is4P:false },
  '4 PZB 168': { capacityAh:168, widthMm:158, lengthMm:77,  heightMm:358, weightKg:11.4, variant:'PzB', plates:4,  is4P:false },
  '5 PZB 210': { capacityAh:210, widthMm:158, lengthMm:93,  heightMm:358, weightKg:13.8, variant:'PzB', plates:5,  is4P:false },
  '6 PZB 252': { capacityAh:252, widthMm:158, lengthMm:109, heightMm:358, weightKg:16.3, variant:'PzB', plates:6,  is4P:false },
  '7 PZB 294': { capacityAh:294, widthMm:158, lengthMm:125, heightMm:358, weightKg:18.8, variant:'PzB', plates:7,  is4P:false },
  '8 PZB 336': { capacityAh:336, widthMm:158, lengthMm:141, heightMm:358, weightKg:21.2, variant:'PzB', plates:8,  is4P:false },
  // height 428
  '2 PZB 110':  { capacityAh:110, widthMm:158, lengthMm:45,  heightMm:428, weightKg:7.9,  variant:'PzB', plates:2,  is4P:false },
  '3 PZB 165':  { capacityAh:165, widthMm:158, lengthMm:61,  heightMm:428, weightKg:11.0, variant:'PzB', plates:3,  is4P:false },
  '4 PZB 220':  { capacityAh:220, widthMm:158, lengthMm:77,  heightMm:428, weightKg:14.0, variant:'PzB', plates:4,  is4P:false },
  '5 PZB 275':  { capacityAh:275, widthMm:158, lengthMm:93,  heightMm:428, weightKg:17.1, variant:'PzB', plates:5,  is4P:false },
  '6 PZB 330':  { capacityAh:330, widthMm:158, lengthMm:109, heightMm:428, weightKg:20.1, variant:'PzB', plates:6,  is4P:false },
  '7 PZB 385':  { capacityAh:385, widthMm:158, lengthMm:125, heightMm:428, weightKg:23.2, variant:'PzB', plates:7,  is4P:false },
  '8 PZB 440':  { capacityAh:440, widthMm:158, lengthMm:141, heightMm:428, weightKg:26.2, variant:'PzB', plates:8,  is4P:false },
  '9 PZB 495':  { capacityAh:495, widthMm:158, lengthMm:157, heightMm:428, weightKg:29.2, variant:'PzB', plates:9,  is4P:false },
  '10 PZB 550': { capacityAh:550, widthMm:158, lengthMm:173, heightMm:428, weightKg:32.3, variant:'PzB', plates:10, is4P:false },
  // height 484
  '2 PZB 130':  { capacityAh:130, widthMm:158, lengthMm:45,  heightMm:484, weightKg:9.1,  variant:'PzB', plates:2,  is4P:false },
  '3 PZB 195':  { capacityAh:195, widthMm:158, lengthMm:61,  heightMm:484, weightKg:12.5, variant:'PzB', plates:3,  is4P:false },
  '4 PZB 260':  { capacityAh:260, widthMm:158, lengthMm:77,  heightMm:484, weightKg:16.1, variant:'PzB', plates:4,  is4P:false },
  '5 PZB 325':  { capacityAh:325, widthMm:158, lengthMm:93,  heightMm:484, weightKg:19.5, variant:'PzB', plates:5,  is4P:false },
  '6 PZB 390':  { capacityAh:390, widthMm:158, lengthMm:109, heightMm:484, weightKg:23.0, variant:'PzB', plates:6,  is4P:false },
  '7 PZB 455':  { capacityAh:455, widthMm:158, lengthMm:125, heightMm:484, weightKg:26.5, variant:'PzB', plates:7,  is4P:false },
  '8 PZB 520':  { capacityAh:520, widthMm:158, lengthMm:141, heightMm:484, weightKg:30.1, variant:'PzB', plates:8,  is4P:false },
  '9 PZB 585':  { capacityAh:585, widthMm:158, lengthMm:157, heightMm:484, weightKg:33.5, variant:'PzB', plates:9,  is4P:false },
  '10 PZB 650': { capacityAh:650, widthMm:158, lengthMm:173, heightMm:484, weightKg:37.0, variant:'PzB', plates:10, is4P:false },
  // height 541
  '2 PZB 150':  { capacityAh:150, widthMm:158, lengthMm:45,  heightMm:541, weightKg:10.3, variant:'PzB', plates:2,  is4P:false },
  '3 PZB 225':  { capacityAh:225, widthMm:158, lengthMm:61,  heightMm:541, weightKg:14.2, variant:'PzB', plates:3,  is4P:false },
  '4 PZB 300':  { capacityAh:300, widthMm:158, lengthMm:77,  heightMm:541, weightKg:18.2, variant:'PzB', plates:4,  is4P:false },
  '5 PZB 375':  { capacityAh:375, widthMm:158, lengthMm:93,  heightMm:541, weightKg:22.2, variant:'PzB', plates:5,  is4P:false },
  '6 PZB 450':  { capacityAh:450, widthMm:158, lengthMm:109, heightMm:541, weightKg:26.2, variant:'PzB', plates:6,  is4P:false },
  '7 PZB 525':  { capacityAh:525, widthMm:158, lengthMm:125, heightMm:541, weightKg:30.2, variant:'PzB', plates:7,  is4P:false },
  '8 PZB 600':  { capacityAh:600, widthMm:158, lengthMm:141, heightMm:541, weightKg:34.2, variant:'PzB', plates:8,  is4P:false },
  '9 PZB 675':  { capacityAh:675, widthMm:158, lengthMm:157, heightMm:541, weightKg:38.2, variant:'PzB', plates:9,  is4P:false },
  '10 PZB 750': { capacityAh:750, widthMm:158, lengthMm:173, heightMm:541, weightKg:42.2, variant:'PzB', plates:10, is4P:false },
  '11 PZB 825': { capacityAh:825, widthMm:158, lengthMm:189, heightMm:541, weightKg:47.8, variant:'PzB', plates:11, is4P:false },
  // height 597
  '2 PZB 170':  { capacityAh:170, widthMm:158, lengthMm:45,  heightMm:597, weightKg:12.3, variant:'PzB', plates:2,  is4P:false },
  '3 PZB 255':  { capacityAh:255, widthMm:158, lengthMm:61,  heightMm:597, weightKg:17.0, variant:'PzB', plates:3,  is4P:false },
  '4 PZB 340':  { capacityAh:340, widthMm:158, lengthMm:77,  heightMm:597, weightKg:21.6, variant:'PzB', plates:4,  is4P:false },
  '5 PZB 425':  { capacityAh:425, widthMm:158, lengthMm:93,  heightMm:597, weightKg:26.3, variant:'PzB', plates:5,  is4P:false },
  '6 PZB 510':  { capacityAh:510, widthMm:158, lengthMm:109, heightMm:597, weightKg:30.9, variant:'PzB', plates:6,  is4P:false },
  '7 PZB 595':  { capacityAh:595, widthMm:158, lengthMm:125, heightMm:597, weightKg:35.6, variant:'PzB', plates:7,  is4P:false },
  '8 PZB 680':  { capacityAh:680, widthMm:158, lengthMm:141, heightMm:597, weightKg:40.4, variant:'PzB', plates:8,  is4P:false },
  '9 PZB 765':  { capacityAh:765, widthMm:158, lengthMm:157, heightMm:597, weightKg:44.8, variant:'PzB', plates:9,  is4P:false },
  '10 PZB 850': { capacityAh:850, widthMm:158, lengthMm:173, heightMm:597, weightKg:49.7, variant:'PzB', plates:10, is4P:false },
  '11 PZB 935': { capacityAh:935, widthMm:158, lengthMm:189, heightMm:597, weightKg:54.4, variant:'PzB', plates:11, is4P:false },
  // height 633
  '2 PZB 200':  { capacityAh:200, widthMm:158, lengthMm:45,  heightMm:633, weightKg:12.9, variant:'PzB', plates:2,  is4P:false },
  '3 PZB 300':  { capacityAh:300, widthMm:158, lengthMm:61,  heightMm:633, weightKg:17.7, variant:'PzB', plates:3,  is4P:false },
  '4 PZB 400':  { capacityAh:400, widthMm:158, lengthMm:77,  heightMm:633, weightKg:22.6, variant:'PzB', plates:4,  is4P:false },
  '5 PZB 500':  { capacityAh:500, widthMm:158, lengthMm:93,  heightMm:633, weightKg:27.5, variant:'PzB', plates:5,  is4P:false },
  '6 PZB 600':  { capacityAh:600, widthMm:158, lengthMm:109, heightMm:633, weightKg:32.4, variant:'PzB', plates:6,  is4P:false },
  '7 PZB 700':  { capacityAh:700, widthMm:158, lengthMm:125, heightMm:633, weightKg:37.3, variant:'PzB', plates:7,  is4P:false },
  '8 PZB 800':  { capacityAh:800, widthMm:158, lengthMm:141, heightMm:633, weightKg:42.2, variant:'PzB', plates:8,  is4P:false },
  '9 PZB 900':  { capacityAh:900, widthMm:158, lengthMm:157, heightMm:633, weightKg:46.8, variant:'PzB', plates:9,  is4P:false },
  // height 713
  '2 PZB 210':  { capacityAh:210, widthMm:158, lengthMm:45,  heightMm:713, weightKg:14.8, variant:'PzB', plates:2,  is4P:false },
  '3 PZB 315':  { capacityAh:315, widthMm:158, lengthMm:61,  heightMm:713, weightKg:20.4, variant:'PzB', plates:3,  is4P:false },
  '4 PZB 420':  { capacityAh:420, widthMm:158, lengthMm:77,  heightMm:713, weightKg:26.1, variant:'PzB', plates:4,  is4P:false },
  '5 PZB 525':  { capacityAh:525, widthMm:158, lengthMm:93,  heightMm:713, weightKg:31.7, variant:'PzB', plates:5,  is4P:false },
  '6 PZB 630':  { capacityAh:630, widthMm:158, lengthMm:109, heightMm:713, weightKg:37.3, variant:'PzB', plates:6,  is4P:false },
  '7 PZB 735':  { capacityAh:735, widthMm:158, lengthMm:125, heightMm:713, weightKg:43.0, variant:'PzB', plates:7,  is4P:false },
  '8 PZB 840':  { capacityAh:840, widthMm:158, lengthMm:141, heightMm:713, weightKg:48.7, variant:'PzB', plates:8,  is4P:false },
}

/**
 * Normalise any user-entered cell type string to the lookup key format.
 * Handles: "4PzS500", "4 PzS 500", "4 PZS 500 4P", "4pzb500", etc.
 */
function normaliseKey(raw) {
  let s = String(raw).trim().toUpperCase()

  // Detect and extract 4P suffix first
  const has4P = /\b4P\b/.test(s)

  // Remove the 4P part temporarily
  s = s.replace(/\b4P\b/g, '').trim()

  // Insert spaces around PZ[SB] if missing: "4PZS500" → "4 PZS 500"
  s = s
    .replace(/(\d)(PZ[SB])/i, '$1 $2')   // digit before PZx
    .replace(/(PZ[SB])(\d)/i, '$1 $2')   // digit after PZx

  // Collapse multiple spaces
  s = s.replace(/\s+/g, ' ').trim()

  return has4P ? `${s} 4P` : s
}

/**
 * Parse a cell type string and return the full specification from the lookup table.
 * Returns null if the string doesn't match any known designation.
 */
export function parseCellType(cellType) {
  if (!cellType) return null
  const key = normaliseKey(cellType)
  const entry = CELL_TABLE[key]
  if (!entry) return null
  return { ...entry, designation: key }
}

/** Export the full table for autocomplete / dropdowns if needed */
export { CELL_TABLE }
