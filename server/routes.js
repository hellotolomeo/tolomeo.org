/**
 * Every page the site has: { path, page, context }. build.js writes each to
 * dist/<path>index.html (or the named file); server.js serves the same.
 */
export function routes(data, config) {
    const index = {
        page: 'shared/pages/index.html',
        context: {
            // The home page's tab title is the name alone.
            title: 'Tolomeo',
            description: data.site.description,
            site: data.site,
            projects: data.indexProjects,
            match: config.FILTER_MATCH,
        },
    };
    const list = [
        { path: '/', ...index },
        // The old address of the index: the same page, pointing search engines at /.
        { path: '/projects/', ...index, context: { ...index.context, canonical: `${config.SITE_URL}/` } },
        {
            path: '/info/',
            page: 'shared/pages/info.html',
            context: { pageTitle: 'Info', info: data.info, description: data.site.description },
        },
        { path: '/404.html', page: 'shared/pages/404.html', context: { pageTitle: 'Nothing here' } },
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
