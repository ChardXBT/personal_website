# documents/

Three folders, so nothing can be mistaken for the resume.

## `resume/`

The live resume, and nothing else. Exactly one PDF lives here — whatever PDF
you put in this folder becomes the resume on the site, under any filename.
This is the only folder the `Resume` workflow watches.

Anything that is not a PDF stops the workflow rather than being ignored, so a
video or an image dropped here is caught instead of sitting unused. Superseded
resumes are moved to `resume/archive/`, which is served `noindex` and is never
scanned.

## `recommendation-letters/`

Letters of reference. Two are here, and their public URLs are pinned by
`_redirects` — `/assets/docs/7f0a386addff.pdf` and
`/assets/docs/tutoring-letter-of-recommendation.pdf` are printed in the
distributed resume, so do not rename these files or this folder.

Adding a letter here does not touch the resume.

## `other-documents/`

Everything else you want hosted on the domain: transcripts, certificates,
project write-ups, demo files. Nothing here is linked from the site
automatically — reference a file by its path, `/documents/other-documents/<name>`,
once you have added it.

Adding a file here does not touch the resume.
