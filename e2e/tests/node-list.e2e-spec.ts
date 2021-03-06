import { deleteNode, moveNode } from '../api';
import * as page from '../page-objects/app.po';
import * as nodeBrowser from '../page-objects/node-browser.po';
import * as nodeList from '../page-objects/node-list.po';
import { assertNoConsoleErrors, inTemporaryFolderWithLanguage, toText } from '../testUtil';

describe('node list', () => {
    beforeEach(async () => {
        await page.navigateToHome();
    });

    describe('breadcrumb', () => {
        it('displays only the project name in root node', async () => {
            expect(await nodeList.getBreadcrumbLinks().map(toText)).toEqual(['demo']);
        });

        it('displays only the project and a folder in a child node of the root node', async () => {
            await nodeList.openFolder('Aircraft');
            expect(await nodeList.getBreadcrumbLinks().map(toText)).toEqual(['demo', 'Aircraft']);
        });
    });

    describe('moving nodes', () => {
        it('displays correctly', async () => {
            await nodeList.openFolder('Vehicle Images');
            await nodeList.moveNode('Ford GT Image');
            await nodeBrowser
                .getBreadcrumbLinks()
                .get(0)
                .click();
            await nodeBrowser.choose();
            expect(await nodeList.getNodeRow('Ford GT Image').isPresent()).toBeFalsy();
            await nodeList
                .getBreadcrumbLinks()
                .get(0)
                .click();
            expect(await nodeList.getNodeRow('Ford GT Image').isPresent()).toBeTruthy();
            // Cleanup
            await moveNode({ uuid: 'df8beb3922c94ea28beb3922c94ea2f6' }, { uuid: '15d5ef7a9abf416d95ef7a9abf316d68' });
        });
    });

    describe('copying nodes', () => {
        it('works in the same folder', async () => {
            await nodeList.copyNode('Yachts');
            await nodeBrowser.choose();
            expect(await nodeList.getNodeRow('Yachts (copy)').isPresent()).toBeTruthy();

            // Cleanup
            deleteNode({ uuid: await nodeList.getNodeUuid('Yachts (copy)') });
        });

        it('works in another folder', async () => {
            await nodeList.copyNode('Yachts');
            await nodeBrowser.openFolder('Aircraft');
            await nodeBrowser.choose();
            expect(await nodeList.getNodeRow('Yachts (copy)').isPresent()).toBeFalsy();
            await nodeList.openFolder('Aircraft');
            expect(await nodeList.getNodeRow('Yachts (copy)').isPresent()).toBeTruthy();

            // Cleanup
            deleteNode({ uuid: await nodeList.getNodeUuid('Yachts (copy)') });
        });
    });

    describe(
        'creating a node',
        inTemporaryFolderWithLanguage('de', folder => {
            it('works without content in default language', async () => {
                await nodeList.openFolder(folder.fields.name);
                await nodeList.createNode('folder');
                await assertNoConsoleErrors();
            });
        })
    );
});
