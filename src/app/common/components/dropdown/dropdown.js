angular.module('caiLunAdminUi.common')
    .controller('mhDropdownController', dropdownController)
    .directive('mhDropdown', dropdownDirective)
    .directive('mhDropdownLabel', dropdownLabelDirective)
    .directive('mhDropdownBody', dropdownBodyDirective);

/**
 * Controller for the mh-dropdown component. The component expects the following markup:
 *
 * <mh-dropdown>
 *    <mh-dropdown-label>
 *        Label
 *    </mh-dropdown-label>
 *    <mh-dropdown-body>
 *        <ul>
 *            <li>Option 1</li>
 *            <li>Option 2</li>
 *        </ul>
 *    </mh-dropdown-body>
 * </mh-dropdown>
 *
 * @param {ng.IScope} $scope
 * @param {ng.IElement} $element
 * @param {ng.IDocumentService} $document
 */
function dropdownController($scope, $element, $document) {
    var vm = this;

    /**
     * Tracks the state of the dropdown
     * @type {boolean}
     */
    vm.isOpen = false;

    vm.align = vm.align || 'left';

    /**
     * Stores the height in pixels of the dropdown label, used for
     * correct positioning of the dropdown options div.
     * @type {number}
     */
    vm.labelHeight = 0;
    vm.toggle = toggle;

    /**
     * Toggle the open state of the dropdown and register a
     * global click handler to close.
     */
    function toggle() {
        vm.isOpen = !vm.isOpen;
        if (vm.isOpen) {
            $document.on('click', closeDropdown);
        }
    }

    /**
     * Close the dropdown and de-register the global click handler.
     * @param {Event} event
     */
    function closeDropdown(event) {
        var target = event.target;
        if (!$element[0].contains(target)) {
            vm.isOpen = false;
            $scope.$digest(function() {
                $document.off('click', closeDropdown);
            });
        }
    }
}

/**
 * The container for the whole dropdown component. Its main purpose is to
 * establish an isolate scope and make the shared controller available
 * to the other parts of the component.
 *
 * @returns {ng.IDirective} Directive definition object
 */
function dropdownDirective() {

    return {
        restrict: 'E',
        template: '<div class="mh-dropdown" ng-transclude></div>',
        controller: 'mhDropdownController',
        controllerAs: 'vm',
        bindToController: true,
        transclude: true,
        replace: true,
        scope: {}
    };
}

/**
 * The dropdown label
 *
 * @returns {ng.IDirective} Directive definition object
 */
function dropdownLabelDirective() {
    function dropdownLabelLink(scope, element, attrs, dropdownCtrl) {
        dropdownCtrl.labelHeight = element[0].offsetHeight;
        scope.dropdown = dropdownCtrl;
    }
    return {
        restrict: 'E',
        template: '<div class="mh-dropdown-label" ng-click="dropdown.toggle()" ng-class="{ open: dropdown.isOpen }" ng-transclude></div>',
        transclude: true,
        replace: true,
        require: '^^mhDropdown',
        link: dropdownLabelLink,
        scope: {}
    };
}

/**
 * The dropdown body.
 *
 * @returns {ng.IDirective} Directive definition object
 */
function dropdownBodyDirective() {
    function linkFn(scope, element, attrs, dropdownCtrl) {
        var container = element[0];

        adjustPosition();

        scope.dropdown = dropdownCtrl;
        container.style.top = dropdownCtrl.labelHeight - 12 + 'px';

        scope.$watch('dropdown.isOpen', setHeight);

        function setHeight(isOpen) {
            var contentsHeight;
            if (isOpen) {
                contentsHeight = container.children[0].offsetHeight;
                container.style.height =  contentsHeight + 12 + 'px';
                container.classList.add('open');
            } else {
                container.style.height = 0;
                container.classList.remove('open');
            }
        }

        /**
         * Check to see if the dropdown body goes off the edge of the viewport,
         * and adjust it if so.
         */
        function adjustPosition() {
            if (container.getBoundingClientRect().left < 0) {
                container.style.left = '0';
                container.style.right = 'auto';
                container.classList.remove('left');
                container.classList.add('right');
            }
        }
    }
    return {
        restrict: 'AE',
        template: '<div class="mh-dropdown-body left"><div class="contents" ng-transclude></div></div>',
        scope: {},
        replace: true,
        transclude: true,
        require: '^^mhDropdown',
        link: linkFn
    };
}