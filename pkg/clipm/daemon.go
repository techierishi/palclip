package clipm

import (
	"context"
	"encoding/binary"
	"palclip/pkg/config"

	"palclip/pkg/util"

	"github.com/wailsapp/wails/v3/pkg/application"
	"golang.design/x/clipboard"
)

type Clip struct {
	ID      int
	Time    int64
	Content []byte
}

func itob(v int) []byte {
	b := make([]byte, 8)
	binary.BigEndian.PutUint64(b, uint64(v))
	return b
}

func Record(ctx context.Context, app *application.App) error {
	logger := util.GetLogInstance()
	logger.Info().Msg("Clipboard recording started...")

	err := clipboard.Init()
	if err != nil {
		panic(err)
	}

	ch := clipboard.Watch(ctx, clipboard.FmtText)

	for data := range ch {

		clipDb := config.GetInstance()
		clipm := ClipM{
			DB: clipDb.DB,
		}

		copiedStr := string(data)

		timestamp := util.UnixMilli()
		clipInfo := ClipInfo{
			Timestamp: timestamp,
			Content:   copiedStr,
		}
		hash := util.CalculateHash(copiedStr)

		clipm.Create(hash, clipInfo)

		str := util.CleanStr(copiedStr).StandardizeSpaces().TruncateText(10).ReplaceNewLine()
		logger.Info().Msg(string(str + "... COPIED!"))
		app.EmitEvent("copy_event", nil)

	}

	return nil
}
