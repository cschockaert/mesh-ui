angular.module('meshAdminUi.common')
    .config(dataServiceConfig)
    .provider('dataService', dataServiceProvider);

/**
 * The dataServiceProvider is used to configure and create the DataService which is used
 * for all requests to the API.
 */
function dataServiceProvider() {

    var apiUrl;

    this.setApiUrl = setApiUrl;
    this.$get = function($http, $q, selectiveCache, Restangular, i18nService) {
        return new DataService($http, $q, selectiveCache, Restangular, i18nService, apiUrl);
    };

    /**
     * Allow config of the API url in the app's config phase.
     * @param value
     */
    function setApiUrl(value) {
        apiUrl = value;
    }
}

/**
 * The data service itself which is responsible for all requests to the API.
 *
 * @param $http
 * @param $q
 * @param selectiveCache
 * @param Restangular
 * @param i18nService
 * @param {string} apiUrl
 * @constructor
 */
function DataService($http, $q, selectiveCache, Restangular, i18nService, apiUrl) {

    selectiveCache.setBaseUrl(apiUrl);
    $http.defaults.cache = selectiveCache;
    Restangular.setBaseUrl(apiUrl);

    var projects = Restangular.all('projects'),
        users = Restangular.all('users'),
        schemas = Restangular.all('schemas'),
        tags = Restangular.all('tags'),
        roles = Restangular.all('roles'),
        groups = Restangular.all('groups');

    // public API
    // ==========
    // Projects
    this.getProjects = getProjects;
    this.getProject = getProject;
    this.persistProject = persistProject;
    this.deleteProject = deleteProject;
    this.getProjectId = getProjectId;
    this.getProjectRootNodeId = getProjectRootNodeId;
    // Users
    this.getUsers = getUsers;
    this.getUser = getUser;
    this.persistUser = persistUser;
    this.deleteUser = deleteUser;
    this.addUserToGroup = addUserToGroup;
    this.removeUserFromGroup = removeUserFromGroup;
    // Groups
    this.getGroups = getGroups;
    // Nodes
    this.getChildNodes = getChildNodes;
    this.getChildFolders = getChildFolders;
    this.getChildContents = getChildContents;
    this.getNode = getNode;
    // Contents
    this.getContents = getContents;
    this.getContent = getContent;
    this.persistContent = persistContent;
    this.deleteContent = deleteContent;
    // Schemas
    this.getSchemas = getSchemas;
    this.getSchema = getSchema;
    // Microschemas
    this.getMicroschema = getMicroschema;
    // Roles
    this.getRoles = getRoles;
    this.getRole = getRole;
    // Breadcrumbs
    this.getBreadcrumb = getBreadcrumb;

    /**
     * Get all projects as a list.
     *
     * @returns {*}
     */
    function getProjects() {
        return projects.getList();
    }

    /**
     * Get the details of a single project specified by uuid.
     *
     * @param {string} uuid
     * @returns {ng.IPromise<any>|restangular.IPromise<any>}
     */
    function getProject(uuid) {
        return Restangular.one('projects', uuid).get();
    }

    /**
     * Persist the project back to the server.
     *
     * @param project
     * @returns {*}
     */
    function persistProject(project) {
        clearCache('projects');
        clearCache('tags');
        if (project.hasOwnProperty('save')) {
            // this is a Restangular object
            return project.save();
        } else {
            // this is a plain object (newly-created)
            var projects = Restangular.all('projects');
            return projects.post(project);
        }
    }

    /**
     * Delete the project from the server.
     * @param project
     * @returns {ng.IPromise<any>|restangular.IPromise<any>|void}
     */
    function deleteProject(project) {
        clearCache('projects');
        return project.remove();
    }

    /**
     * Get the uuid of the specified project.
     *
     * @param {string} projectName
     * @returns {ng.IPromise.<string>}
     */
    function getProjectId(projectName) {
        return getProjectProperty(projectName, 'uuid');
    }

    /**
     * Get the root tag uuid of the specified project.
     *
     * @param {string} projectName
     * @returns {ng.IPromise.<string>}
     */
    function getProjectRootNodeId(projectName) {
        return getProjectProperty(projectName, 'rootNodeUuid');
    }

    /**
     * Get the value of the specified property for a project matching
     * projectName. If no matching project is found, the promise is
     * rejected.
     *
     * @param {string} projectName
     * @param {string} propertyName
     * @returns {ng.IPromise<string>}
     */
    function getProjectProperty(projectName, propertyName) {
        var deferred = $q.defer();

        getProjects().then(function(projects) {
            var filtered = projects.filter(function(project) {
                return project.name === projectName;
            });

            if (filtered[0] && filtered[0][propertyName]) {
                deferred.resolve(filtered[0][propertyName]);
            } else {
                deferred.reject('Property "' + propertyName + '" of project "' + projectName + '" not found.');
            }
        });

        return deferred.promise;
    }

    function getUsers() {
        // stub
        return users.getList();
    }

    function getUser(uuid) {
        return Restangular.one('users', uuid).get();
    }

    /**
     * Persist the user back to the server.
     *
     * @param user
     * @returns {*}
     */
    function persistUser(user) {
        clearCache('users');
        if (user.hasOwnProperty('save')) {
            // this is a Restangular object
            return user.save();
        } else {
            // this is a plain object (newly-created)
            var users = Restangular.all('users');
            return users.post(user);
        }
    }

    /**
     *
     * @param user
     */
    function deleteUser(user) {
        clearCache('users');
        return user.remove();
    }

    function addUserToGroup(userId, groupId) {
        var endpoint = Restangular.all('users/' + userId + '/groups/' + groupId);
        return endpoint.doPUT();
    }

    function removeUserFromGroup(userId, groupId) {
        var endpoint = Restangular.all('users/' + userId + '/groups/' + groupId);
        return endpoint.remove();
    }


    function getGroups() {
        // stub
        return groups.getList();
    }

    /**
     * Get the child tags for the parentTag in the given project.
     *
     * @param {string} projectName
     * @param parentNodeId
     * @param {Object=} queryParams
     * @returns {ng.IPromise<any>|restangular.ICollectionPromise<any>}
     */
    function getChildNodes(projectName, parentNodeId, queryParams) {
        var url = projectName + '/nodes/' + parentNodeId + '/children/',
            nodes = Restangular.all(url);

        queryParams = queryParams || {};
        queryParams.lang = i18nService.getCurrentLang().code;

        return nodes.getList(queryParams)
            .then(unwrapCurrentLanguage);
    }

    function getChildFolders(projectName, parentNodeId, queryParams) {
        var url = projectName + '/nodes/' + parentNodeId + '/children_folders',
            nodes = Restangular.all(url);

        queryParams = queryParams || {};
        queryParams.lang = i18nService.getCurrentLang().code;

        return nodes.getList()
            .then(unwrapCurrentLanguage);
    }
    function getChildContents(projectName, parentNodeId, queryParams) {
        var url = projectName + '/nodes/' + parentNodeId + '/children_contents',
            nodes = Restangular.all(url);

        queryParams = queryParams || {};
        queryParams.lang = i18nService.getCurrentLang().code;

        return nodes.getList()
            .then(unwrapCurrentLanguage);
    }

    /**
     * Get a single node.
     *
     * @param {string} projectName
     * @param uuid
     * @returns {restangular.RestangularElement|restangular.IElement}
     */
    function getNode(projectName, uuid) {
        var contents = Restangular.all(projectName);
        var queryParams = {
            lang: i18nService.languages.map(function(lang) {
                return lang.code;
            }).join(',')
        };

        return contents.one('nodes', uuid).get(queryParams);
    }

    /**
     * Get a single tag specified by uuid.
     *
     * @param {string} projectName
     * @param {string} uuid
     * @param {Object=} queryParams
     * @returns {ng.IPromise<Object>}
     */
    function getTag(projectName, uuid, queryParams) {
        var url = projectName + '/tags/' + uuid,
            tag = Restangular.one(url);

        queryParams = queryParams || {};
        queryParams.lang = i18nService.getCurrentLang().code;

        return tag.get(queryParams)
            .then(unwrapCurrentLanguage);
    }

    /**
     * Get the contents of a given project, with optional parameters that specifies query string options.
     *
     * @param {string} projectName
     * @param {string} parentTagId
     * @param {Object=} queryParams
     * @returns {restangular.EnhancedCollectionPromise<any>|restangular.ICollectionPromise<any>}
     */
    function getContents(projectName, parentTagId, queryParams) {
        var url = projectName + '/tags/' + parentTagId + '/contents/',
            contents = Restangular.all(url);

        queryParams = queryParams || {};
        queryParams.lang = i18nService.getCurrentLang().code;

        return contents.getList(queryParams)
            .then(unwrapCurrentLanguage);
    }

    /**
     * Get a single content record.
     *
     * @param {string} projectName
     * @param uuid
     * @returns {restangular.RestangularElement|restangular.IElement}
     */
    function getContent(projectName, uuid) {
        var contents = Restangular.all(projectName);
        var queryParams = {
            lang: i18nService.languages.map(function(lang) {
                return lang.code;
            }).join(',')
        };

        return contents.one('nodes', uuid).get(queryParams);
    }

    /**
     * Create or update the content object on the server.
     * @param {string} projectName
     * @param {Object} content
     * @returns {*|ng.IPromise<any>|restangular.IPromise<any>|void}
     */
    function persistContent(projectName, content) {
        clearCache('contents');
        if (content.hasOwnProperty('save')) {
            // this is a Restangular object
            return content.save();
        } else {
            // this is a plain object (newly-created)
            var contents = Restangular.all(projectName + '/contents');
            return contents.post(content);
        }
    }

    /**
     * Remove the content from the server.
     * @param content
     * @returns {*|ng.IPromise<any>|restangular.IPromise<any>|void}
     */
    function deleteContent(content) {
        clearCache('contents');
        return content.remove();
    }

    function getSchemas() {
        // stub
        return schemas.getList();
    }

    /**
     *
     * @param uuid
     * @returns {ng.IPromise<any>|restangular.IPromise<any>}
     */
    function getSchema(uuid) {
        return Restangular.one('schemas', uuid).get();
    }

    /**
     * Get a microschema by name
     * @param name
     * @returns {ng.IPromise<any>|restangular.IPromise<any>}
     */
    function getMicroschema(name) {
        return Restangular.one('microschemas', name).get();
    }

    function getRoles() {
        return roles.getList();
    }

    function getRole(uuid) {
        return Restangular.one('roles', uuid).get();
    }

    function getBreadcrumb(projectName, uuid) {
        return Restangular.one(projectName + '/breadcrumb', uuid).get();
    }

    /**
     * Clear the $http cache of all keys matching groupName. Proper use of this method
     * depends on the use of the selectiveCache service, which allows selective removal
     * of only certain groups of cached keys at a time. The groupName parameter must
     * match a groupName registered with the `selectiveCacheProvider.setCacheableGroups()`
     * config method.
     *
     * @param {string} groupName
     */
    function clearCache(groupName) {
        selectiveCache.remove(groupName);
    }

    /**
     * Normalize the response to remove the extra language properties
     * and move the content of the currently-selected language up to
     * the "properties" level.
     *
     * @param data
     * @returns {*}
     */
    function unwrapCurrentLanguage(data) {
        var lang = i18nService.getCurrentLang().code;

        function extractCurrentLanguage(item) {
            if (item.properties && item.properties[lang]) {
                item.properties = item.properties[lang];
            }
            return item;
        }

        if (data.constructor === Array) {
            data.forEach(extractCurrentLanguage);
        } else {
            extractCurrentLanguage(data);
        }

        return data;
    }

    /**
     * Re-wraps the object's "properties" in the current language, i.e. "properties" { ... }
     * becomes "properties" { "en": ... }
     * @param obj
     */
    function wrapCurrentLanguage(obj) {
        var properties = angular.copy(obj.properties),
            lang = i18nService.getCurrentLang().code;

        obj.properties = {};
        obj.properties[lang] = properties;
        return obj;
    }


}

/**
 * Configure Restangular
 *
 * @param RestangularProvider
 * @param selectiveCacheProvider
 */
function dataServiceConfig($httpProvider, RestangularProvider, selectiveCacheProvider) {
    // basic auth credentials: joe1:test123
    // header string: Authorization: Basic am9lMTp0ZXN0MTIz
    // TODO: this will be replaced by an OAuth 2 solution.
    RestangularProvider.setDefaultHeaders({ "Authorization": "Basic am9lMTp0ZXN0MTIz"});

    RestangularProvider.setRestangularFields({
       id: "uuid"
    });

    RestangularProvider.addResponseInterceptor(restangularResponseInterceptor);

    /**
     * Interceptor to add index.json to get requests, so the mock backend works without
     * specific server config like DirectoryIndex or MultiViews
     * TODO: Remove this when moving to real API
     */
    $httpProvider.interceptors.push(function() {
        return {
            'request': function(config) {
                if (config.url.match(/mesh-mock-backend\/dummy\/nodes\/[a-z_]*$/)) {
                    config.url += '/index.json';
                } else if (config.url.match(/mesh-mock-backend\//)) {
                    config.url = config.url.substr(0, config.url.length ) + '.json';
                }
                return config;
            }
        };
    });


    // define the urls we wish to cache
    var projectName = '^\\/[a-zA-Z\\-]*',
        uuid = '[a-z0-9]{30,32}',
        _ = '\\/',
        projectNameTags = projectName + _ + 'tags' + _ + uuid + _;

    var cacheable = {
        'projects': /^\/projects/,
        'contents': new RegExp(projectNameTags + 'contents\\/', 'gi'),
        'tags':  new RegExp(projectNameTags + 'tags\\/', 'gi'),
        'tag':  new RegExp(projectName + _ + 'tags' + _ + uuid, 'gi'),
        'schemas': /^\/schemas$/,
        'schema': /^\/schemas\/[a-z0-9]+$/
    };
    selectiveCacheProvider.setCacheableGroups(cacheable);
}

/**
 * Extract the payload from the response, which is returned as the value of the "data" key.
 *
 * @param {Object} data
 * @param {string} operation
 * @returns {Object}
 */
function restangularResponseInterceptor(data, operation) {
    var extractedData;

    if (operation === "getList") {
        extractedData = data.data;
        if (data._metainfo) {
            extractedData.metadata = data._metainfo;
        }
    } else {
        extractedData = data;
    }

    return extractedData;
}