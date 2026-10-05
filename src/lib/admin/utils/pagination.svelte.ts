export function createPagination(total = 0, pageSize = 5) {
	let currentPage = $state(1);
	let totalItems = $state(total);
	let itemsPerPage = $state(pageSize);

	const totalPages = $derived(
		Math.max(1, Math.ceil(totalItems / itemsPerPage))
	);

	const startItem = $derived(
		totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
	);

	const endItem = $derived(
		Math.min(currentPage * itemsPerPage, totalItems)
	);

	return {
		get currentPage() {
			return currentPage;
		},

		get totalItems() {
			return totalItems;
		},

		get totalPages() {
			return totalPages;
		},

		get itemsPerPage() {
			return itemsPerPage;
		},

		get startItem() {
			return startItem;
		},

		get endItem() {
			return endItem;
		},

		setTotal(total: number) {
			totalItems = total;
		},

		goTo(page: number) {
			currentPage = page;
		},

		next() {
			if (currentPage < totalPages) currentPage++;
		},

		previous() {
			if (currentPage > 1) currentPage--;
		},

		setPageSize(size: number) {
			itemsPerPage = size;
			currentPage = 1;
		}
	};
}