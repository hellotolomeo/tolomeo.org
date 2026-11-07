// The assumptions of BRIEF.md §9, one constant each. Flip one here and rebuild;
// no template or stylesheet needs touching.
export default {
    // 'page': every project has its own page at /projects/<slug>/ (the client's wording).
    // 'inline' (the accordion under the open row) is kept possible but is not built.
    PROJECT_VIEW: 'page',
    // 'any': a project shows when it has at least one active tag (OR); 'all': every active tag (AND).
    FILTER_MATCH: 'any',
    // Swap a grid cell to its hover_image while the cell or its row is pointed at.
    HOVER_SWAP: true,
    // Polaroid frames sit slightly off-grid, offset deterministically from the slug.
    FRAME_JITTER: true,
    // The intro reads "Tolomeo is…": that is content, in content/site/index.md.
    // The colour of the tags in the index list.
    TAG_COLOR: '#b5b7b7',
    // Absolute address, for rel=canonical.
    SITE_URL: 'https://tolomeo.org',
};
