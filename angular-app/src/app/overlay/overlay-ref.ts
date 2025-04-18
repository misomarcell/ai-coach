import { OverlayRef } from "@angular/cdk/overlay";
import { Subject, Observable } from "rxjs";
import { take } from "rxjs/operators";

/**
 * A reference to the currently open fullscreen overlay.
 * Instance of the component loaded into the overlay.
 */
export class FullscreenOverlayRef<T = any, R = any> {
	private _result: R | undefined;
	private readonly _afterClosed = new Subject<R | undefined>();

	afterClosed$: Observable<R | undefined> = this._afterClosed.asObservable();
	componentInstance: T | null = null;

	constructor(public overlayRef: OverlayRef) {
		overlayRef
			.detachments()
			.pipe(take(1))
			.subscribe(() => {
				this._afterClosed.next(this._result);
				this._afterClosed.complete();
				this.componentInstance = null;
			});

		overlayRef
			.backdropClick()
			.pipe(take(1))
			.subscribe(() => this.close());
	}

	/**
	 * Closes the overlay and optionally passes a result.
	 * @param result The data to pass back to the caller.
	 */
	close(result?: R): void {
		this._result = result;
		this.overlayRef.dispose();
	}
}
