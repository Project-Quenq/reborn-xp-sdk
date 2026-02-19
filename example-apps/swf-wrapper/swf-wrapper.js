(function () {
  const windowTemplate = `
        <appcontentholder style="background-color: #000; overflow: hidden; display: flex; align-items: center; justify-content: center;">
            <iframe id="ruffle-iframe" style="width: 100%; height: 100%; border: none;"></iframe>
        </appcontentholder>
    `;

  registerApp({
    _template: null,
    _currentBlobUrl: null,

    setup: async function () {
      this._template = document.createElement("template");
      this._template.innerHTML = windowTemplate;
    },

    start: async function (options) {
      const installPath = options.installPath;
      if (!installPath) {
        dialogHandler.spawnDialog({
          icon: "error",
          title: "Error",
          text: "This app must be installed to locate its files.",
        });
        return;
      }

      const windowContents =
        this._template.content.firstElementChild.cloneNode(true);
      const hWnd = wm.createNewWindow("swf-wrapper", windowContents);

      // Developers should change these values to match their game.
      wm.setCaption(hWnd, "Bubble Trouble");
      wm.setSize(hWnd, 550, 400); // Default Flash game size

      if (options.icon) {
        wm.setIcon(hWnd, options.icon);
      }

      const iframe = windowContents.querySelector("#ruffle-iframe");

      try {
        // Initialize the iframe and wait for it to be ready
        await new Promise((resolve) => {
          iframe.onload = resolve;
          iframe.srcdoc = `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <style>body { margin: 0; overflow: hidden; }</style>
                            <script src="/res/js/ruffle/ruffle.js"></script>
                        </head>
                        <body></body>
                        </html>
                    `;
        });

        // Wait for the Ruffle script inside the iframe to load
        await new Promise((resolve, reject) => {
          let attempts = 0;
          const interval = setInterval(() => {
            if (iframe.contentWindow && iframe.contentWindow.RufflePlayer) {
              clearInterval(interval);
              resolve();
            } else if (attempts > 50) {
              clearInterval(interval);
              reject(
                new Error("Ruffle player did not load inside the iframe."),
              );
            }
            attempts++;
          }, 100);
        });

        const ruffle = iframe.contentWindow.RufflePlayer.newest();
        const player = ruffle.createPlayer();
        iframe.contentDocument.body.appendChild(player);

        const swfPath = dm.join(installPath, "game.swf");

        // Read the SWF file as a Blob and create a URL for it.
        // This bypasses any network/VFS issues inside the iframe.
        const node = await dm.open(swfPath);
        if (!node || !node.content)
          throw new Error("'game.swf' not found or is empty.");

        if (this._currentBlobUrl) URL.revokeObjectURL(this._currentBlobUrl);
        this._currentBlobUrl = URL.createObjectURL(node.content);

        player.load({ url: this._currentBlobUrl });

        // OPTIONAL: GLOBAL VIRTUAL GAMEPAD
        // If your game requires keyboard controls (Arrows/Space),
        // enable the system gamepad overlay.
        if (window.SystemGamepad) {
          window.SystemGamepad.show();
        }

      } catch (error) {
        dialogHandler.spawnDialog({
          icon: "error",
          title: "Flash Error",
          text: `Could not load the game: ${error.message}`,
        });
        // Hide gamepad if loading failed
        if (window.SystemGamepad) window.SystemGamepad.hide();
        wm.closeWindow(hWnd);
        return;
      }

      wm._windows[hWnd].addEventListener(
        "wm:windowClosed",
        () => {
          // Hide the gamepad overlay when the app is closed
          if (window.SystemGamepad) {
            window.SystemGamepad.hide();
          }

          if (this._currentBlobUrl) {
            URL.revokeObjectURL(this._currentBlobUrl);
            this._currentBlobUrl = null;
          }
        },
        { once: true },
      );

      return hWnd;
    },
  });
})();