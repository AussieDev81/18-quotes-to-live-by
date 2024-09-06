const modalTrigger = document.getElementById("modalTrigger");
const birthdayModal = document.getElementById("birthdayModal");
const closeModal = document.getElementById("closeModal");
const DEV_MODE_ACTIVE = false;

renderQuotes();

/**
 * Loads quotes from the source JSON file if there are no quotes stored in local storage
 */
async function renderQuotes() {
	const dailyQuoteDivElement = document.getElementById("daily-quote");
	const unlockedQuotesListElement = document.getElementById("unlocked-quotes-list");
	const comeBackTomorrowDivElement = document.getElementById("come-back-tomorrow");
	const comeBackTomorrowMessage =
		"You have already unlocked today's quote, come back tomorrow to unlock the next one!";
	const closeButton = `
	<svg id="close-button" xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-square-x close-btn" width="20" height="20" viewBox="0 0 24 24" stroke-width="1.5" stroke="#333" fill="none" stroke-linecap="round" stroke-linejoin="round">
		<path stroke="none" d="M0 0h24v24H0z" fill="none"/>
		<path d="M3 5a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-14z" />
		<path d="M9 9l6 6m0 -6l-6 6" />
	</svg>`;
	const QUOTE_UNLOCK_COMPLETE_MESSAGE =
		"🎈 Congratulations.... You have viewed all 18 quotes! 🎈<br><small>Be sure to print or save them for future reference</small>";
	const SOURCE_URL = "./json/quotes.json";
	const LOCAL_STORAGE__QUOTES = "QUOTES";
	const LOCAL_STORAGE__LAST_UNLOCK_DATE = "LAST_UNLOCK_DATE";
	const TODAY = new Date();

	// If no quotes are found in the users' local storage
	if (!getQuotes()) {
		console.log("Initializing quotes into local storage");
		await fetch(SOURCE_URL)
			.then((response) => response.json())
			.then((data) => {
				setQuotes(data);
				console.log("Quotes loaded successfully");
				showDailyQuote(findNextLockedQuote());
				showUnlockedQuotes();
			})
			.catch((error) => console.error("Error loading quotes into local storage: ", error));
	}
	// If there are already quotes in local storage
	else {
		// If the user returns at least one day later
		if (isAtLeastNextDay(getLastUnlockDate(), TODAY) || DEV_MODE_ACTIVE) {
			console.log("Locally stored quotes detected");
			showDailyQuote(findNextLockedQuote());
			showUnlockedQuotes();
		}
		// If the user returns on the same day
		else {
			// Display the "Come back tomorrow" message
			comeBackTomorrowDivElement.innerHTML = `${closeButton} &nbsp; ${comeBackTomorrowMessage}`;
			document.querySelector("#close-button").addEventListener("click", () => {
				comeBackTomorrowDivElement.hidden = true;
			});
			comeBackTomorrowDivElement.hidden = false;
			console.log("Page revisited before the next day");

			// Show the last unlocked quote
			showDailyQuote(findLastUnlockedQuote());
			showUnlockedQuotes();
		}
	}

	// ==================== Quote Related Functions ====================

	/**
	 * Show the given quote in the 'daily-quote' section
	 * @param {*} quote The quote to be shown in the daily quote section
	 */
	function showDailyQuote(quote) {
		if (quote === undefined) {
			dailyQuoteDivElement.innerHTML = QUOTE_UNLOCK_COMPLETE_MESSAGE;
			//Reset and do it again if in dev mode
			if (DEV_MODE_ACTIVE) {
				if(confirm("Reset and start again?")){
					localStorage.removeItem(LOCAL_STORAGE__QUOTES);
					localStorage.removeItem(LOCAL_STORAGE__LAST_UNLOCK_DATE);
				}
			}
		} else {
			dailyQuoteDivElement.innerHTML = `<h2>Today's Quote...</h2>${quote.message}`;
			dailyQuoteDivElement.title = `Quote #${quote.id}`;
			setQuoteLocked(quote.id, false);
			setLastUnlockDate(TODAY);
			console.log("Showing quote: ", quote);
			console.log("Next locked quote : ", findNextLockedQuote());
		}
	}

	/**
	 * Show the previously unlocked quotes on the page
	 */
	function showUnlockedQuotes() {
		const unlockedQuotes = getUnlockedQuotes();

		if (unlockedQuotes) {
			// Show a "previously unlocked quotes" heading if there are previously unlocked quotes to display
			if (unlockedQuotes.length > 0) {
				unlockedQuotesListElement.innerHTML = "<b>Unlocked Quotes...</b>";
			}

			// Show each previously unlocked quote iteratively in a new list item
			unlockedQuotes.forEach((quote) => {
				const li = document.createElement("li");
				li.id = `quote-${quote.id}`;
				li.title = `Quote #${quote.id}`;
				li.textContent = quote.message;
				unlockedQuotesListElement.appendChild(li);
			});

			addPrintButton();
		}
	}

	/**
	 * Get all unlocked quotes
	 * @returns A list of quotes that have been unlocked
	 */
	function getUnlockedQuotes() {
		const unlockedQuotes = getQuotes();
		if (unlockedQuotes) return unlockedQuotes.filter((quote) => quote.isLocked === false);
		else return;
	}

	/**
	 * Sets the locally stored quotes to the given quotes
	 * @param {[{*}]} quoteArray The array of quote objects
	 */
	function setQuotes(quoteArray) {
		localStorage.setItem(LOCAL_STORAGE__QUOTES, JSON.stringify(quoteArray));
	}

	/**
	 * Get all quotes from local storage
	 * @returns The quotes currently stored in local storage as a list of objects
	 */
	function getQuotes() {
		return JSON.parse(localStorage.getItem(LOCAL_STORAGE__QUOTES));
	}

	/**
	 * Set the 'isLocked' status of a quote
	 * @param {Number} quoteId The ID associated with the target quote
	 * @param {Boolean} status True if the quote is to be locked, false if it is to be unlocked
	 */
	function setQuoteLocked(quoteId, status) {
		let quotes = getQuotes();
		let targetQuote = quotes.find((quote) => quote.id === quoteId);
		targetQuote.isLocked = status;
		setQuotes(quotes);
		console.log(`Quote with id \'${quoteId}\' has been ${status ? "locked" : "unlocked"}`);
	}

	/**
	 * Find the next locked quote
	 * @returns The next locked quote, this will be the first locked quote in order following the unlocked quotes
	 */
	function findNextLockedQuote() {
		const quotes = getQuotes();
		const nextLockedQuote = quotes.find((quote) => quote.isLocked === true);
		return nextLockedQuote;
	}

	/**
	 * Find the last unlocked quote
	 * @returns The last unlocked quote in order before the locked quotes
	 */
	function findLastUnlockedQuote() {
		const quotesReversed = getQuotes().slice().reverse();
		const lastUnlockedQuote = quotesReversed.find((quote) => quote.isLocked === false);
		return lastUnlockedQuote;
	}

	// ==================== Date Related Functions ====================

	/**
	 * Get the last date that a quote was unlocked
	 * @returns The last unlocked date
	 */
	function getLastUnlockDate() {
		return localStorage.getItem(LOCAL_STORAGE__LAST_UNLOCK_DATE);
	}

	/**
	 * Set the 'last unlocked' date
	 * @param {Date} date The 'last unlocked' date
	 */
	function setLastUnlockDate(date) {
		localStorage.setItem(LOCAL_STORAGE__LAST_UNLOCK_DATE, date);
	}

	/**
	 * Checks if an unlock date was at least the day before (not bound to 24 hours but any time during the previous day)
	 * @param {*} lastUnlockDate The last date a quote was unlocked
	 * @param {*} currentDate The current date
	 * @returns True if the last unlock date was at least one day ago, false if not
	 */
	function isAtLeastNextDay(lastUnlockDate, currentDate) {
		// Remove the time component from both dates to prevent enforcing a 24hr minimum calculation
		const truncatedDate1 = new Date(lastUnlockDate);
		truncatedDate1.setHours(0, 0, 0, 0);

		const truncatedDate2 = new Date(currentDate);
		truncatedDate2.setHours(0, 0, 0, 0);

		// Calculate the difference in milliseconds
		const timeDifference = truncatedDate2.getTime() - truncatedDate1.getTime();

		// Check if the difference is at least 1 day (or more)
		return timeDifference >= 24 * 60 * 60 * 1000;
	}
}

// ==================== Modal window Functions ====================

// Show the modal the furst time a user visits the page
window.onload = () => {
	const BIRTHDAY_MESSAGE_VIEWED_DATE = "BIRTHDAY_MESSAGE_VIEWED_DATE";
	if (localStorage.getItem(BIRTHDAY_MESSAGE_VIEWED_DATE) === null) {
		// if (true) {
		birthdayModal.style.display = "block";
		localStorage.setItem(BIRTHDAY_MESSAGE_VIEWED_DATE, new Date());
	}
	// Add in a sneaky birthday surprise to the console
	console.warn("⭐⭐⭐ HEY LEIGHTON!!! ⭐⭐⭐\n\nNow that I have your attention, check your bank account 🏦\n\nTHIS IS NOT A SCAM!... I love you son ❣️")
};

// Close the modal when the close button is clicked
closeModal.addEventListener("click", () => {
	birthdayModal.style.display = "none";
});

function addPrintButton() {
	// Add a print button that will print the list of previously unlocked quotes
	const printButton = document.createElement("button");
	printButton.textContent = "Print Unlocked Quotes";
	printButton.id = "print-button";
	printButton.className = "print-btn";
	printButton.onclick = () => {
		var printwin = window.open("");
		printwin.document.write(document.getElementById("unlocked-quotes-list").innerHTML);
		printwin.stop(); // Stop loading (Chrome bug workaround)
		printwin.print();
		printwin.close();
	};
	document.querySelector(".page-container").appendChild(printButton);
}
