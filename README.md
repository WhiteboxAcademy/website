# Whitebox Academy website

The source for [whiteboxacademy.in](https://whiteboxacademy.in). It's a plain static site
hosted on GitHub Pages, so pushing to `main` publishes it.

- **Update course progress:** change `data-parts-released` on the `<body>` of the course page.
- **Add a course:** copy `courses/build-an-ai-agent/`, then add a `.course-card` to `index.html`.
- **Turn on email sign-ups:** set `SIGNUP_ACTION` in `assets/site.js`.

To preview it, run `python3 -m http.server` here. Links start at the site root, so opening
the files directly won't work.
