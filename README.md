# Images to PDF

A React web app for converting image folders, ZIP files, or RAR files into a PDF. Images can be grouped into pages, previewed before generation, reordered by page, and exported as a downloadable PDF.

## Features

- Upload an image folder, individual images, a ZIP file, or a RAR file.
- Generate a PDF in the browser.
- Choose 1 to 10 images per PDF page.
- Use either:
  - **Image fills the page**: images become the PDF page content directly.
  - **Standard paper page**: images are placed inside Letter, A4, or Legal pages.
- Choose paper orientation: Portrait or Landscape.
- Configure margin and spacing for standard paper pages.
- Preview the selected page before generating.
- Reorder pages by dragging page thumbnails.
- Preview or download the generated PDF.

## Supported Image Formats

JPG, PNG, WEBP, GIF, BMP, AVIF, HEIC, and HEIF are accepted.

Note: Some browsers may not be able to decode every format, especially HEIC/HEIF. If an image cannot be read, convert it to JPG or PNG and try again.

## Requirements

- Node.js
- npm

This project was built with Vite and React.

## Install

```bash
npm install
```

## Run Locally

```bash
npm run dev -- --host 127.0.0.1
```

Open:

```text
http://127.0.0.1:5173/
```

## Build

```bash
npm run build
```

The production build is generated in `dist/`.

## Preview Production Build

```bash
npm run preview
```

## Project Structure

```text
src/
  App.jsx
  main.jsx
  styles.css
  components/
    CompositionPanel.jsx
    PagePreview.jsx
    PreviewPanels.jsx
    SuccessModal.jsx
    UploadPanel.jsx
  lib/
    constants.js
    copy.js
    fileUtils.js
    layout.js
    pdf.js
```

## Text and Labels

All user-facing text is centralized in:

```text
src/lib/copy.js
```

Edit that file if you want to change labels, status messages, or error messages.

## Notes for GitHub

Do not commit `node_modules/` or `dist/`. They are excluded in `.gitignore`.

