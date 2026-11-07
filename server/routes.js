/**
 * Every page the site has: { path, page, context }. build.js writes each to
 * dist/<path>index.html (or the named file); server.js serves the same.
 */
export function routes(data, config) {
    const index = {
        page: 'shared/pages/index.html',
        context: {
            pageTitle: 'Index',
            description: data.site.intro,
            site: data.site,
            projects: data.indexProjects,
            match: config.FILTER_MATCH,
            hoverSwap: config.HOVER_SWAP,
        },
    };
    const list = [
        { path: '/', ...index },
        // The old address of the index: the same page, pointing search engines at /.
        { path: '/projects/', ...index, context: { ...index.context, canonical: `${config.SITE_URL}/` } },
        {
            path: '/info/',
            page: 'shared/pages/info.html',
            context: { pageTitle: 'Info', info: data.info, description: data.site.intro },
        },
        { path: '/404.html', page: 'shared/pages/404.html', context: { pageTitle: 'Nothing here' } },
        {
            path: '/tools/thumbnail/',
            page: 'shared/pages/thumbnail.html',
            context: { pageTitle: 'Thumbnail preview', noindex: true, projects: data.indexProjects },
        },
    ];
    if (config.PROJECT_VIEW === 'page') {
        for (const project of data.projects) {
            list.push({
                path: project.href,
                page: 'shared/pages/project.html',
                context: { pageTitle: project.title, project, canonical: `${config.SITE_URL}${project.href}` },
            });
        }
    }
    return list;
}

/** dist-relative file for a route path. */
export function fileFor(path) {
    return path.endsWith('/') ? `${path}index.html` : path;
}
