package main

import (
	"embed"
	_ "embed"
	"log"
	"runtime"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/icons"
)

// Wails uses Go's `embed` package to embed the frontend files into the binary.
// Any files in the frontend/dist folder will be embedded into the binary and
// made available to the frontend.
// See https://pkg.go.dev/embed for more information.

//go:embed frontend/dist
var assets embed.FS

// main function serves as the application's entry point. It initializes the application, creates a window,
// and starts a goroutine that emits a time-based event every second. It subsequently runs the application and
// logs any error that might occur.
func main() {

	// Create a new Wails application by providing the necessary options.
	// Variables 'Name' and 'Description' are for application metadata.
	// 'Assets' configures the asset server with the 'FS' variable pointing to the frontend files.
	// 'Bind' is a list of Go struct instances. The frontend has access to the methods of these instances.
	// 'Mac' options tailor the application when running an macOS.
	app := application.New(application.Options{
		Name:        "palclip",
		Description: "A demo of using raw HTML & CSS",
		Services: []application.Service{
			application.NewService(&AppService{}),
		},
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
	})
	systemTray := app.NewSystemTray()
	isFramelss := runtime.GOOS == "windows"

	// Create a new window with the necessary options.
	// 'Title' is the title of the window.
	// 'Mac' options tailor the window when running on macOS.
	// 'BackgroundColour' is the background colour of the window.
	// 'URL' is the URL that will be loaded into the webview.
	app.NewWebviewWindowWithOptions(application.WebviewWindowOptions{
		Title: "Window 1",
		Mac: application.MacWindow{
			InvisibleTitleBarHeight: 50,
			Backdrop:                application.MacBackdropTranslucent,
			TitleBar:                application.MacTitleBarHiddenInset,
		},
		BackgroundColour: application.NewRGB(27, 38, 54),
		URL:              "/",
		KeyBindings: map[string]func(window *application.WebviewWindow){
			"F12": func(window *application.WebviewWindow) {
				systemTray.OpenMenu()
			},
		},
		Frameless: isFramelss,
	})

	if runtime.GOOS == "darwin" {
		systemTray.SetTemplateIcon(icons.SystrayMacTemplate)
	}

	myMenu := app.NewMenu()
	myMenu.Add("Settings").OnClick(func(ctx *application.Context) {
		println("Settings")
		q := application.QuestionDialog().SetTitle("Ready?").SetMessage("Are you feeling ready?")
		q.AddButton("Yes").OnClick(func() {
			println("Awesome!")
		})
		q.AddButton("No").SetAsDefault().OnClick(func() {
			println("Boo!")
		})
		q.Show()
	})

	myMenu.AddSeparator()
	myMenu.Add("Quit").OnClick(func(ctx *application.Context) {
		app.Quit()
	})

	systemTray.SetMenu(myMenu)
	// Create a goroutine that emits an event containing the current time every second.
	// The frontend can listen to this event and update the UI accordingly.
	go func() {
		for {
			now := time.Now().Format(time.RFC1123)
			app.Events.Emit(&application.WailsEvent{
				Name: "time",
				Data: now,
			})
			time.Sleep(time.Second)
		}
	}()

	// Run the application. This blocks until the application has been exited.
	err := app.Run()

	// If an error occurred while running the application, log it and exit.
	if err != nil {
		log.Fatal(err)
	}
}
