let isLoading = $state(false);

export const pageLoader = {
	get active() {
		return isLoading;
	},
	show: () => (isLoading = true),
	hide: () => (isLoading = false)
};