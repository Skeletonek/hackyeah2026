import { createCn } from "cn/config"

// Splot's own type scale (globals.css). Without this, `text-h4` and
// `text-simple-base` are read as colours and dropped next to `text-primary`.
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display",
            "h1",
            "h2",
            "h3",
            "h4",
            "lead",
            "simple-h1",
            "simple-h2",
            "simple-h3",
            "simple-h4",
            "simple-lead",
            "simple-base",
            "simple-sm",
          ],
        },
      ],
    },
  },
})
