(function () {
  const windowTemplate = `
        <appcontentholder class="ace-editor-app" style="display: flex; flex-direction: column; height: 100%;">
            <appnavigation>
                <ul class="appmenus">
                    <li>File
                        <ul class="submenu">
                            <li data-action="new">New</li>
                            <li data-action="open">Open...</li>
                            <li data-action="save">Save</li>
                            <li data-action="saveas">Save As...</li>
                            <li class="divider"></li>
                            <li data-action="exit">Exit</li>
                        </ul>
                    </li>
                    <li>View
                        <ul class="submenu">
                            <li data-action="wordwrap" class="submenu-toggle">
                                <span class="checkmark"></span>Word Wrap
                            </li>
                        </ul>
                    </li>
                    <li>Language
                        <ul class="submenu" id="language-menu">
                            <li data-action="lang-javascript"><span class="checkmark"></span>JavaScript</li>
                            <li data-action="lang-html"><span class="checkmark"></span>HTML</li>
                            <li data-action="lang-css"><span class="checkmark"></span>CSS</li>
                            <li data-action="lang-json"><span class="checkmark"></span>JSON</li>
                        </ul>
                    </li>
                    <li>Theme
                        <ul class="submenu">
                            <li data-action="theme-twilight" class="submenu-toggle"><span class="checkmark"></span>Twilight (Dark)</li>
                            <li data-action="theme-chrome" class="submenu-toggle"><span class="checkmark"></span>Chrome (Light)</li>
                        </ul>
                    </li>
                </ul>
            </appnavigation>
            <!-- IFRAME to isolate from OS zoom -->
            <iframe id="ace-iframe" style="flex-grow: 1; width: 100%; border: none;"></iframe>
        </appcontentholder>
    `;

  registerApp({
    _template: null,
    _currentPath: null,
    _isDirty: false,
    _editor: null,
    _hWnd: null,
    _wordWrapEnabled: false,
    _currentTheme: "ace/theme/chrome",
    _iframeWindow: null,

    setup: async function () {
      this._template = document.createElement("template");
      this._template.innerHTML = windowTemplate;
    },

    start: async function (options) {
      const installPath = options.installPath;
      if (!installPath) {
        dialogHandler.spawnDialog({
          icon: "error",
          title: "Notepad++ Error",
          text: "This app requires an installation path.",
        });
        return;
      }

      const windowContents =
        this._template.content.firstElementChild.cloneNode(true);
      this._hWnd = wm.createNewWindow("aceeditor", windowContents);

      this.loadSettings();

      wm.setCaption(this._hWnd, "Notepad++");
      if (options.icon) wm.setIcon(this._hWnd, options.icon);
      wm.setSize(this._hWnd, 700, 500);

      const iframe = windowContents.querySelector("#ace-iframe");

      await new Promise((resolve) => {
        if (
          iframe.contentDocument &&
          iframe.contentDocument.readyState === "complete"
        )
          resolve();
        else iframe.onload = resolve;
      });

      this._iframeWindow = iframe.contentWindow;
      const doc = this._iframeWindow.document;

      doc.open();
      doc.write(`
                <!DOCTYPE html>
                <html>
                <head><style>body { margin: 0; overflow: hidden; }</style></head>
                <body><div id="editor" style="width: 100vw; height: 100vh;"></div></body>
                </html>
            `);
      doc.close();

      const injectScriptFromVFS = async (vfsPath) => {
        try {
          let content = await dm.readFile(vfsPath);
          if (content instanceof Blob) content = await content.text();

          const script = doc.createElement("script");
          script.textContent = content;
          doc.head.appendChild(script);
        } catch (e) {
          console.error("Failed to inject script:", vfsPath, e);
          throw e;
        }
      };

      try {
        await injectScriptFromVFS(dm.join(installPath, "ace/ace.js"));
        await injectScriptFromVFS(
          dm.join(installPath, "ace/theme-twilight.js"),
        );
        await injectScriptFromVFS(dm.join(installPath, "ace/theme-chrome.js"));
        await injectScriptFromVFS(
          dm.join(installPath, "ace/mode-javascript.js"),
        );
        await injectScriptFromVFS(dm.join(installPath, "ace/mode-html.js"));
        await injectScriptFromVFS(dm.join(installPath, "ace/mode-css.js"));
        await injectScriptFromVFS(dm.join(installPath, "ace/mode-json.js"));

        if (this._iframeWindow.ace) {
          this._editor = this._iframeWindow.ace.edit("editor");
          this._editor.setTheme(this._currentTheme);
          this._editor.session.setUseWrapMode(this._wordWrapEnabled);

          this._iframeWindow.addEventListener("click", () => {
            this._editor.focus();
          });
        } else {
          throw new Error("Ace not found in iframe window");
        }

        this.updateMenuChecks();

        if (
          options.filePath &&
          !options.filePath.toLowerCase().endsWith(".exe")
        ) {
          await this.loadFile(options.filePath);
        } else {
          this._editor.setValue(
            "// Welcome to Notepad++ running in Reborn XP!",
            -1,
          );
          this.setLanguageModeByExtension("");
        }

        this._editor.on("change", () => {
          if (!this._isDirty) {
            this._isDirty = true;
            this.updateTitle();
          }
        });
      } catch (error) {
        console.error(error);
        dialogHandler.spawnDialog({
          icon: "error",
          title: "Initialization Error",
          text: "Failed to load Ace Editor components.",
        });
        wm.closeWindow(this._hWnd);
        return;
      }

      this.updateTitle();
      this.setupMenuActions(windowContents);

      wm._windows[this._hWnd].addEventListener(
        "wm:windowClosed",
        () => {
          this._editor = null;
          this._iframeWindow = null;
        },
        { once: true },
      );

      return this._hWnd;
    },

    setupMenuActions: function (contents) {
      contents.querySelector('[data-action="new"]').onclick = () =>
        this.handleNew();
      contents.querySelector('[data-action="open"]').onclick = () =>
        this.handleOpen();
      contents.querySelector('[data-action="save"]').onclick = () =>
        this.handleSave(false);
      contents.querySelector('[data-action="saveas"]').onclick = () =>
        this.handleSave(true);
      contents.querySelector('[data-action="exit"]').onclick = () =>
        this.handleExit();

      contents.querySelector('[data-action="wordwrap"]').onclick = () => {
        this._wordWrapEnabled = !this._wordWrapEnabled;
        if (this._editor)
          this._editor.session.setUseWrapMode(this._wordWrapEnabled);
        this.saveSettings();
        this.updateMenuChecks();
      };

      contents.querySelector('[data-action="theme-twilight"]').onclick = () => {
        this._currentTheme = "ace/theme/twilight";
        if (this._editor) this._editor.setTheme(this._currentTheme);
        this.saveSettings();
        this.updateMenuChecks();
      };
      contents.querySelector('[data-action="theme-chrome"]').onclick = () => {
        this._currentTheme = "ace/theme/chrome";
        if (this._editor) this._editor.setTheme(this._currentTheme);
        this.saveSettings();
        this.updateMenuChecks();
      };

      contents.querySelector('[data-action="lang-javascript"]').onclick = () =>
        this.setLanguageModeByExtension("js");
      contents.querySelector('[data-action="lang-html"]').onclick = () =>
        this.setLanguageModeByExtension("html");
      contents.querySelector('[data-action="lang-css"]').onclick = () =>
        this.setLanguageModeByExtension("css");
      contents.querySelector('[data-action="lang-json"]').onclick = () =>
        this.setLanguageModeByExtension("json");

      const closeButton = wm._windows[this._hWnd].querySelector(
        "appcontrols .closebtn",
      );
      if (closeButton) {
        const newCloseButton = closeButton.cloneNode(true);
        closeButton.parentNode.replaceChild(newCloseButton, closeButton);
        newCloseButton.onclick = async (e) => {
          e.stopPropagation();
          await this.handleExit();
        };
      }
    },

    updateTitle: function () {
      const fileName = this._currentPath
        ? dm.basename(this._currentPath)
        : "Untitled";
      wm.setCaption(
        this._hWnd,
        `${this._isDirty ? "*" : ""}${fileName} - Notepad++`,
      );
    },

    loadFile: async function (filePath) {
      try {
        let content = await dm.readFile(filePath);
        if (content instanceof Blob) {
          content = await content.text();
        }
        if (this._editor) this._editor.setValue(content, -1);
        this._currentPath = filePath;
        this._isDirty = false;
        this.setLanguageModeByExtension(filePath);
        this.updateTitle();
      } catch (e) {
        dialogHandler.spawnDialog({
          icon: "error",
          title: "Open Error",
          text: e.message,
        });
      }
    },

    setLanguageModeByExtension: function (filePath) {
      if (!this._editor) return;
      const ext = filePath.split(".").pop().toLowerCase();
      let mode = "ace/mode/javascript";
      switch (ext) {
        case "html":
        case "htm":
          mode = "ace/mode/html";
          break;
        case "css":
          mode = "ace/mode/css";
          break;
        case "json":
          mode = "ace/mode/json";
          break;
      }
      this._editor.session.setMode(mode);
      this.updateMenuChecks();
    },

    loadSettings: function () {
      const savedTheme = localStorage.getItem("aceEditor.theme");
      const savedWrap = localStorage.getItem("aceEditor.wordWrap");
      if (savedTheme) this._currentTheme = savedTheme;
      if (savedWrap) this._wordWrapEnabled = savedWrap === "true";
    },

    saveSettings: function () {
      localStorage.setItem("aceEditor.theme", this._currentTheme);
      localStorage.setItem("aceEditor.wordWrap", this._wordWrapEnabled);
    },

    updateMenuChecks: function () {
      const selfWindow = wm._windows[this._hWnd];
      if (!selfWindow || !this._editor) return;

      const wwCheck = selfWindow.querySelector(
        '[data-action="wordwrap"] .checkmark',
      );
      if (wwCheck) wwCheck.textContent = this._wordWrapEnabled ? "✓" : "";

      selfWindow
        .querySelectorAll('[data-action^="theme-"] .checkmark')
        .forEach((el) => (el.textContent = ""));
      const themeCheck = selfWindow.querySelector(
        `[data-action="theme-${this._currentTheme.split("/").pop()}"] .checkmark`,
      );
      if (themeCheck) themeCheck.textContent = "✓";

      selfWindow
        .querySelectorAll('[data-action^="lang-"] .checkmark')
        .forEach((el) => (el.textContent = ""));
      const currentMode = this._editor.session.getMode().$id.split("/").pop();
      const langCheck = selfWindow.querySelector(
        `[data-action="lang-${currentMode}"] .checkmark`,
      );
      if (langCheck) langCheck.textContent = "✓";
    },

    handleNew: async function () {
      if (!this._editor) return;
      if (this._isDirty) {
        const choice = await this.promptSaveChanges();
        if (choice === "cancel") return;
        if (choice === "save") {
          const saved = await this.handleSave(false);
          if (!saved) return;
        }
      }
      this._editor.setValue("", -1);
      this._currentPath = null;
      this._isDirty = false;
      this.updateTitle();
    },

    handleOpen: async function () {
      if (!this._editor) return;
      if (this._isDirty) {
        const choice = await this.promptSaveChanges();
        if (choice === "cancel") return;
        if (choice === "save") {
          const saved = await this.handleSave(false);
          if (!saved) return;
        }
      }
      const fileFilters = [
        {
          name: "All supported documents",
          extensions: ["js", "json", "html", "htm", "css", "txt"],
        },
        { name: "JavaScript files (*.js)", extensions: ["js"] },
        { name: "JSON files (*.json)", extensions: ["json"] },
        { name: "HTML files (*.html, *.htm)", extensions: ["html", "htm"] },
        { name: "CSS files (*.css)", extensions: ["css"] },
        { name: "All files (*.*)", extensions: ["*.*"] },
      ];
      const filePath = await wm.openFileDialog({
        title: "Open Code File",
        filters: fileFilters,
      });
      if (!filePath) return;
      await this.loadFile(filePath);
    },

    handleSave: async function (isSaveAs = false) {
      if (!this._editor) return false;
      let savePath = this._currentPath;
      if (isSaveAs || !savePath) {
        const fileFilters = [
          { name: "JavaScript files (*.js)", extensions: ["js"] },
          { name: "JSON files (*.json)", extensions: ["json"] },
          { name: "HTML files (*.html)", extensions: ["html"] },
          { name: "CSS files (*.css)", extensions: ["css"] },
          { name: "Text files (*.txt)", extensions: ["txt"] },
          { name: "All files (*.*)", extensions: ["*.*"] },
        ];
        savePath = await wm.saveFileDialog({
          title: "Save File As",
          filters: fileFilters,
        });
        if (!savePath) return false;
      }

      try {
        await dm.writeFile(savePath, this._editor.getValue());
        this._currentPath = savePath;
        this._isDirty = false;
        this.updateTitle();
        return true;
      } catch (e) {
        dialogHandler.spawnDialog({
          icon: "error",
          title: "Save Error",
          text: e.message,
        });
        return false;
      }
    },

    handleExit: async function () {
      if (this._isDirty) {
        const choice = await this.promptSaveChanges();
        if (choice === "cancel") return;
        if (choice === "save") {
          const saved = await this.handleSave(false);
          if (!saved) return;
        }
      }
      wm.closeWindow(this._hWnd);
    },

    promptSaveChanges: function () {
      return new Promise((resolve) => {
        const fileName = this._currentPath
          ? dm.basename(this._currentPath)
          : "Untitled";
        dialogHandler.spawnDialog({
          icon: "question",
          title: "Notepad++",
          text: `Do you want to save changes to ${fileName}?`,
          buttons: [
            [
              "Yes",
              (e) => {
                wm.closeWindow(e.target.closest("app").id);
                resolve("save");
              },
            ],
            [
              "No",
              (e) => {
                wm.closeWindow(e.target.closest("app").id);
                resolve("no");
              },
            ],
            [
              "Cancel",
              (e) => {
                wm.closeWindow(e.target.closest("app").id);
                resolve("cancel");
              },
            ],
          ],
        });
      });
    },
  });
})();
