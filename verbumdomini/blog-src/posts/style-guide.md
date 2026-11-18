title: How to write a post for the Verbum Domini Blog
seo_title: Writing Guide for the Verbum Domini Blog
description: Every building block a post can use: headings, images, quotes, lists, code, callouts and footnotes, with the syntax for each one.
category: Guides
tags: Writing, Guide
author: editor
date: 2026-11-18
draft: true
---
This post is a draft: the build leaves it out unless it runs with `BLOG_DRAFTS=1`. It shows every building block a post can use. A paragraph is plain text; leave an empty line between paragraphs. **Bold**, *italics*, `code` and [links](https://verbumdomini.ca/) work inside a paragraph.[^syntax]

## Headings

A line starting with `## ` is a section heading and goes into "On this page". A line starting with `### ` is a smaller heading inside a section.

### A smaller heading

Headings give readers and Google the outline of the post.

## Images

![Saint Jerome, followed by his lion, while his fellow monks flee in fright](images/jerome-carpaccio.jpg "Vittore Carpaccio, *Saint Jerome and the Lion* (1502). Click to zoom.")

## Quotes and lists

> In the beginning was the Word, and the Word was with God, and the Word was God. (John 1:1)

- A bullet list starts each line with a dash.
- Numbered lists start each line with `1.`, `2.` and so on.

1. First
2. Second

## Callouts

> [!NOTE] A note
> A callout starts with `> [!NOTE] Title`. The other kinds are TIP, WARNING and QUOTE.

> [!TIP]- A collapsed callout
> A minus sign after the kind, as in `[!TIP]-`, starts it closed. A plus sign starts it open.

## Code

```html
<p>Code blocks get a copy button.</p>
```

## Footnotes

A footnote reference looks like this.[^note] Hover over it or tap it to read the note without leaving the paragraph.

[^syntax]: Inline HTML also works, for anything this guide does not cover.
[^note]: The note's text goes at the end of the post, on a line starting with `[^name]:`.
