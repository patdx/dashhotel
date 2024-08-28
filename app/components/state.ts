import { makeAutoObservable } from 'mobx';

export const dashboardState = makeAutoObservable({
	highlightedLogId: null as string | null,
});
