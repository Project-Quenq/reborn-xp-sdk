# Getting Started: Building Your First App in Reborn XP

Welcome, developer! This is the definitive guide to creating, testing, and running applications entirely within the Reborn XP environment.

### Table of Contents
1.  [The Development Workflow](#the-development-workflow-in-os-testing)
2.  [Setting Up Your Workspace](#step-1-setting-up-your-workspace)
3.  [**Example 1: Creating a Local Webview App**](#example-1-creating-a-local-webview-app)
4.  [**Example 2: Creating a Custom API App**](#example-2-creating-a-custom-api-app)
5.  [**Advanced Topic: Handling Complex UIs and Touch Issues**](#advanced-topic-handling-complex-uis-and-touch-issues)
6.  [Understanding the Test Launcher vs. Production](#understanding-the-test-launcher-vs-production)     
7.  [Next Steps](#next-steps)

---

## The Development Workflow: In-OS Testing

The official workflow is to build and test your application directly inside Reborn XP. You will write your code using an in-OS editor like **Notepad++**, save your files to the virtual **D: drive**, and use a simple `.exe` launcher on your desktop for instant testing. This allows you to see your changes in real-time without any external tools.

---

## Step 1: Setting Up Your Workspace

First, create a dedicated, organized folder for your projects.

1.  **Install Notepad++:** Open `Start Menu` -> `All Programs` -> `App Market` and install **Notepad++**. This is the recommended IDE for Reborn XP development.
2.  **Create a Dev Folder:** Open `My Computer` -> `D:` drive. Create a new folder named `dev`. This is where all your projects will live.

---

## Example 1: Creating a Local Webview App

This is the most common and easiest way to get started. It's perfect for packaging existing HTML5 games or web tools.

### Step 1.1: Create the Project Files
1.  **Create a Project Folder:** Inside `D:/dev/`, create a new folder named `MyWebGame`.
2.  **Create a `src` Folder:** Inside `MyWebGame`, create another folder named `src`. This is where you will place your static HTML, CSS, and JS files.
3.  **Create an `index.html`:** Open Notepad++, create a simple HTML file, and save it as `D:/dev/MyWebGame/src/index.html`.
    ```html
    <body style="font-family: Tahoma; text-align: center;"><h1>My Cool Web Game!</h1></body>
    ```
4.  **Create the JS Wrapper:** Every App Market app needs a JavaScript entry point. Open a new tab in Notepad++ and paste the code from `/example-apps/webview-local/webview-local.js` in this SDK. Save this file as `D:/dev/MyWebGame/start.js`.

### Step 1.2: Create the Test Launcher
1.  **Go to the Desktop.** Right-click an empty area, select `New` -> `Text Document`, and name it `Test MyWebGame.exe`.
2.  **Open it with Notepad++** and paste the following JSON.

    ```json
    {
        "action": "apps.load('D:/dev/MyWebGame/start.js').then(app => { if(app && app.start) app.start({ installPath: 'D:/dev/MyWebGame' }) })",
        "icon": "defaultapp.png"
    }
    ```
3.  **Save the launcher.** Double-click it to run your webview app!

---

## Example 2: Creating a Custom API App

This is for creating apps with a more native feel that interact directly with the OS. Our Music Player is the perfect example, as it demonstrates a modular design and asset loading.

### Step 2.1: Create the Project Files
1.  **Create a Project Folder:** Inside `D:/dev/`, create a new folder named `MyMusicPlayer`.
2.  **Create the Logic Module (`player-logic.js`):**
    *   Open Notepad++.
    *   Copy the entire code from `/example-apps/music-player/player-logic.js` in this SDK.
    *   Save this file inside your project folder as `D:/dev/MyMusicPlayer/player-logic.js`.
3.  **Create the Main App File (`music-player.js`):**
    *   Open a new tab in Notepad++.
    *   Copy the entire code from `/example-apps/music-player/music-player.js` in this SDK.
    *   Save this file in the same folder as `D:/dev/MyMusicPlayer/music-player.js`.
4.  **Create or Upload the App Icon (`icon.png`):**
    *   Open Paint, create a **100x100** pixel image.
    *   Save it inside your project folder as `D:/dev/MyMusicPlayer/icon.png`.

Your project folder should now contain three files: `music-player.js`, `player-logic.js`, and `icon.png`.
### Step 2.2: Create the Test Launcher
1.  **Create a new `.exe` launcher** on your Desktop named `Test MyMusicPlayer.exe`.
2.  **Open it with Notepad++** and paste the following JSON.

    ```json
    {
        "action": "apps.load('D:/dev/MyMusicPlayer/music-player.js').then(app => { if(app && app.start) app.start({ installPath: 'D:/dev/MyMusicPlayer', icon: 'D:/dev/MyMusicPlayer/icon.png' }) })",
        "icon": "D:/dev/MyMusicPlayer/icon.png"
    }
    ```
3.  **Save and run!** Your Music Player will now launch, load its own logic module, and use your custom icon for both the launcher and the window.

---

## Advanced Topic: Handling Complex UIs and Touch Issues

The Reborn XP interface uses a non-standard `zoom` property on mobile devices to scale the UI. While this works for native components, it can cause problems for complex third-party libraries/canvases (such as games) that rely on precise mouse/touch coordinates.

**If your app uses a `<canvas>` or seems to have misaligned clicks on mobile, the solution is to run your app's core UI inside an `<iframe>`.**

The `<iframe>` isolates your app's document, shielding it from the OS's `zoom` property and ensuring all coordinates are 1:1.

*   **For a complete example, see the `notepad-plus-plus` app.** It demonstrates how to load a complex library (Ace Editor) into an `<iframe>` by reading the script files from the VFS and injecting them directly, which avoids common network errors.
*   **For a gaming example, see the `swf-wrapper` app.** It shows how to load Ruffle and a game file into an `<iframe>` for perfect touch controls.

### Adding Mobile Controls (Global Virtual Gamepad)
For games that run in an isolated `<iframe>` but require keyboard input, Reborn XP provides a global `SystemGamepad` API. This works automatically with whichever window is currently focused.

1.  **Show the Gamepad:** Call `window.SystemGamepad.show()` after your game loads. This will display a virtual D-Pad and Action button on touch devices.
2.  **Hide on Close:** Always call `window.SystemGamepad.hide()` when your app window is closed.

This gamepad API is designed for flash games that rely on simple directional and action inputs, but it can be used for any app that needs basic virtual controls on mobile. It will automatically show the gamepad if the user is on a touch device, and hide it if they are on desktop. You can also ship your custom gamepad in your game if it uses more than arrow keys and space, and restrict it to touch devices using `const isTouch = ('ontouchstart' in window)`.

Check the `swf-wrapper` example to see this API in action.

---

## Understanding the Test Launcher vs. Production

It is critical to understand the difference between your temporary `.exe` test launcher and how your app will work when published on the App Market.

### For Testing: The `.exe` Launcher
The `.exe` file you create on your desktop is a **development tool**. You have to manually provide all the context your app needs to run:
*   You tell it which `.js` file to load.
*   You **manually provide the `installPath`** so your app can find its assets (like `player-logic.js`). 
*   You **manually provide the `icon` path** for both the launcher itself and for the app's window.      

### For Production: The App Market Installer
When you submit your app to the **[App Market](https://github.com/Project-Quenq/app-market)**, the process is automated and much simpler for the end-user.

1.  You provide your `.zip` bundle and a separate `icon.png` to the market repository.
2.  When a user clicks "Install," the Reborn XP installer handles everything **automatically**:
    *   It creates the installation folder (e.g., `C:/Program Files/MyMusicPlayer/`).
    *   It extracts all the files from your bundle into that folder.
    *   It downloads the icon you provided to the market and saves it inside the installation folder.    
    *   It generates the final `.exe` launcher, shortcuts on the desktop, and Start Menu entries.        
    *   It **automatically** injects the correct `installPath` and `icon` path into the launch command.  

**In summary: You use the `.exe` launcher to *simulate* the environment that the App Market will create for you in production.**

---

## Next Steps

You now have a complete, professional workflow for building and testing applications.
*   Dive into the **[API Reference](./API_REFERENCE.md)** for all available functions.
*   Browse the **[UI Component Gallery](./UI_COMPONENTS.md)** to style your app.
*   When your app is ready, learn how to **[Publish to the App Market](https://github.com/Project-Quenq/app-market)**.