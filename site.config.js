// The site's assumptions, one constant each (BRIEF.md §9). Flip one here and rebuild;
// no template or stylesheet needs touching.
export default {
    // 'page': every project has its own page at /projects/<slug>/ (the client's wording).
    // 'inline' (the accordion under the open row) is kept possible but is not built.
    PROJECT_VIEW: 'page',
    // 'any': a project shows when it has at least one active tag (OR); 'all': every active tag (AND).
    FILTER_MATCH: 'any',
    // The colour of the type labels in the index list and of "role:" / "for:": 67% of the text colour.
    TAG_COLOR: '#807279',
    // Absolute address, for rel=canonical.
    SITE_URL: 'https://tolomeo.org',
};
