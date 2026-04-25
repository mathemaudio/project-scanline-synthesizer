import './UploadedImagePreview.lll'
import { AssertFn, Scenario, ScenarioParameter, Spec, SubjectFactory, WaitForFn } from './system/lll.lll'
import { UploadedImagePreview } from './UploadedImagePreview.lll'

@Spec('Exercises the uploaded image preview through visible rendered output only.')
export class UploadedImagePreviewTest {
	testType = 'behavioral'

	@Scenario('rendering a selected uploaded row shows a horizontal marker at the active row position')
	static async showsSelectedRowMarker(subjectFactory: SubjectFactory<UploadedImagePreview>, scenario?: ScenarioParameter): Promise<{ markerTop: string, imageAlt: string }> {
		const assert: AssertFn = scenario?.assert ?? this.failFastAssert
		const waitFor: WaitForFn = scenario?.waitFor ?? this.failFastWaitFor
		const preview = await subjectFactory()
		preview.imageUrl = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 4"/%3E'
		preview.imageName = 'rows.svg'
		preview.selectedRowIndex = 1
		preview.rowCount = 2
		await preview.updateComplete
		await waitFor(() => (preview.shadowRoot?.querySelector<HTMLElement>('#selected-row-line')?.style.top ?? '') === '75%', 'Expected selected row marker to align to the second row center')
		const marker = preview.shadowRoot?.querySelector<HTMLElement>('#selected-row-line')
		const image = preview.shadowRoot?.querySelector<HTMLImageElement>('#uploaded-image-element')
		assert(marker !== null && marker !== undefined, 'Expected selected row marker to render')
		assert(image !== null && image !== undefined, 'Expected uploaded image element to render')
		const markerTop = marker.style.top
		const imageAlt = image.alt
		assert(markerTop === '75%', 'Expected the selected row marker to move to the active row center')
		assert(imageAlt.includes('rows.svg'), 'Expected uploaded image alt text to include the image name')
		return { markerTop, imageAlt }
	}

	@Spec('Provides a local assertion fallback when the scenario runner omits helper functions.')
	private static failFastAssert(condition: boolean, message?: string): asserts condition {
		if (condition === false) {
			throw new Error(message ?? 'Assertion failed')
		}
	}

	@Spec('Provides a local waitFor fallback when the scenario runner omits helper functions.')
	private static async failFastWaitFor(predicate: () => boolean | Promise<boolean>, message: string): Promise<void> {
		const passed = await predicate()
		if (passed === false) {
			throw new Error(message)
		}
	}
}
