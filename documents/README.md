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

Unlisted files currently here (shared by direct link only; not linked from
the site, served `noindex`). The date in each filename is the day the
document was generated, so you can tell when it is due for a fresh copy:

| Short link | File | Generated |
| --- | --- | --- |
| `/transcript` | `eric-song-academic-history-2026-10-31.pdf` (ACORN academic history) | 2026-10-31 |
| `/enrolment` | `eric-song-confirmation-of-enrolment-2026-10-31.pdf` (U of T confirmation of enrolment, date of birth and student number redacted) | 2026-10-31 |

Keep personal identifiers out of this public repo: flatten the page to an
image, paint over the values, and rebuild the PDF from the image alone so no
text layer or earlier version survives. A box drawn over text is not a redaction. An invisible text layer
may be added back for ATS and search, with the redacted values replaced by
"[redacted]" — then search the file for the values before committing.

To refresh one: add the new PDF with the new date in its name, point the
short link in `_redirects` at it, and delete the old file.

