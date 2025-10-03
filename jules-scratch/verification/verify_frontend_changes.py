from playwright.sync_api import sync_playwright, expect, TimeoutError

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={'width': 400, 'height': 800},
        user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1'
    )
    page = context.new_page()

    urls_to_try = ["http://localhost:8081", "http://localhost:19006"]
    connected_url = None

    for url in urls_to_try:
        try:
            print(f"Attempting to connect to {url}...")
            page.goto(url, timeout=15000, wait_until='domcontentloaded')
            connected_url = url
            print(f"Successfully connected to {url}")
            break
        except Exception as e:
            print(f"Failed to connect to {url}: {e}")

    if not connected_url:
        print("Could not connect to the development server on any of the attempted ports.")
        browser.close()
        return

    try:
        print("Verifying header elements...")
        timeout = 30000

        dashboard_title = page.get_by_role("heading", name="Dashboard")
        expect(dashboard_title).to_be_visible(timeout=timeout)
        print("Dashboard title found.")

        premium_link = page.locator('a[href="/premium"]')
        expect(premium_link).to_be_visible(timeout=timeout)
        print("Premium link found. Clicking it...")
        premium_link.click()

        print("Verifying subscription screen...")

        subscription_title = page.get_by_role("heading", name="Choose a Plan")
        expect(subscription_title).to_be_visible(timeout=timeout)
        print("Subscription screen title found.")

        restore_button = page.get_by_role("button", name="Restore Purchases")
        expect(restore_button).to_be_visible(timeout=timeout)
        print("Restore Purchases button found.")

        screenshot_path = "jules-scratch/verification/subscription_screen.png"
        page.screenshot(path=screenshot_path)
        print(f"Verification successful. Screenshot saved to {screenshot_path}")

    except Exception as e:
        print(f"An error occurred during verification: {e}")
        error_path = "jules-scratch/verification/error.png"
        page.screenshot(path=error_path)
        print(f"Error screenshot saved to {error_path}")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)