/**
 * Promised-models BEM registry
 */

(function (Model) {

    /**
     * model with declarative format for attributes
     * @class {Model}
     */
    var DeclarativeModel = Model.inherit({

        /**
         * @override
         */
        __constructor: function () {
            this.cid = jQuery.identify();
            Model.getList().push(this);
            this.__base.apply(this, arguments);
        },

        /**
         * @override
         */
        destruct: function () {
            var list = Model.getList(),
                index = list.indexOf(this);
            if (index !== -1) {
                list.splice(index, 1);
            }
            this.__base.apply(this, arguments);
        }

    }, {
        /**
         * get model of current class by client id
         * @param  {Model.cid} cid
         * @return {Model}
         */
        getOne: function (cid) {
            var modelClass = this;
            if (arguments.length === 0) {
                return Model.getList().filter(function (instance) {
                    return instance instanceof modelClass;
                })[0];
            } else {
                return Model.getOne(cid);
            }
        },

        /**
         * get or create instance with storage id
         * @param  {Model.id} [id]
         * @return {Model}
         */
        getAny: function (id) {
            var instance, model = this,
                idAttributeName, data;
            if (arguments.length === 0) {
                instance = this.getOne();
                if (!instance) {
                    instance = this.create();
                }
            } else {
                instance = Model.getList().filter(function (instance) {
                    return instance instanceof model && instance.idAttribute.isEqual(id);
                })[0];
                if (!instance) {
                    idAttributeName = this.getIdAttributeName();
                    data = {};
                    data[idAttributeName] = id;
                    instance = this.create(data);
                }
            }
            return instance;
        },

        /**
         * create model instance
         * @param  {Object} [data]
         * @returns {BEM.Model}
         */
        create: function (data) {
            return new this(data);
        },

        /**
         * @returns {String}
         */
        getIdAttributeName: function () {
            var idAttributeName, isIdAttributeDeclared,
                attributes = this.prototype.attributes || {};

            isIdAttributeDeclared = Object.keys(attributes).some(function (attributeName) {
                var attributeDecl = attributes[attributeName],
                    isIdAttribute;

                if (typeof attributeDecl === 'function') {
                    isIdAttribute = attributeDecl.prototype.isId;
                } else if (typeof attributeDecl.type === 'string') {
                    isIdAttribute = attributeDecl.type === 'Id';
                }

                if (isIdAttribute) {
                    idAttributeName = attributeName;
                    return true;
                }
                return false;
            });

            return isIdAttributeDeclared ? idAttributeName : 'id';
        }
    });

    /**
     * decl model
     * @param  {string} blockName
     * @param  {string} [baseBlock]
     * @param  {Object} props
     * @param  {Object} [staticProps]
     */
    Model.decl = function (blockName, baseBlock, props, staticProps) {
        var baseClass, attributes, attributesDecl,
            baseStorageClass;

        if (typeof baseBlock !== 'string') {
            staticProps = props;
            props = baseBlock;
            baseBlock = null;
        }

        props = props || {};
        staticProps = staticProps || {};

        if (BEM.blocks[blockName]) {
            baseClass = BEM.blocks[blockName];
        } else if (baseBlock) {
            baseClass = BEM.blocks[baseBlock];
        } else {
            baseClass = DeclarativeModel;
        }

        baseStorageClass = baseClass.prototype.storage || Model.Storage;

        if (props.storage && !(props.storage instanceof Model.Storage)) {
            props.storage = baseStorageClass.inherit(props.storage);
        }

        attributesDecl = jQuery.extend({}, baseClass.prototype.attributes || {}, props.attributes || {});

        props.attributes = Object.keys(attributesDecl).reduce(function (result, attrName) {
            var attributeDecl = attributesDecl[attrName],
                type = attributeDecl.type,
                modelType = attributeDecl.modelType,
                attributeClass;

            if (typeof attributeDecl === 'function') {
                //class
                attributeClass = attributeDecl;
            } else if (type === 'Model' || type === 'ModelsList' || type === 'Collection') {
                if (!BEM.blocks[modelType]) {
                    throw new Error('Unknown attribute modelType:' + modelType);
                }
                //nested type
                attributeClass = Model.attributeTypes[type].inherit(attributeDecl).inherit({
                    modelType: BEM.blocks[modelType]
                });
            } else if (Model.attributeTypes[type]) {
                //common types
                attributeClass = Model.attributeTypes[type].inherit(attributeDecl);
            } else if (BEM.blocks[type]) {
                //custom type
                attributeClass = BEM.blocks[type].inherit(attributeDecl);
            } else {
                throw new Error('Unknown attribute type:' + type);
            }
            result[attrName] = attributeClass;
            return result;
        }, {});

        props.blockName = blockName;
        staticProps.blockName = blockName

        BEM.blocks[blockName] = baseClass.inherit(props, staticProps);
    };

    /**
     * get model instance
     * @param  {Model.cid} cid
     * @return {Model}
     */
    Model.getOne = function (cid) {
        if (arguments.length === 0) {
            return this.getList()[0];
        } else {
            return this.getList().filter(function (instance) {
                return instance.cid === cid;
            })[0];
        }
    };

    /**
     * get storage for model instances
     * @abstract
     * @return {Array}
     */
    Model.getList = function () {
        throw new Error('not implemented');
    };
}(BEM.Model));
