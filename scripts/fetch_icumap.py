import os
import asyncio
from playwright.async_api import async_playwright

ICUMAP_URL = "https://campus.icu.ac.jp/icumap/ehb/SearchCO.aspx"
USER_ID = os.environ.get("ICUMAP_USER")
PASSWORD = os.environ.get("ICUMAP_PASSWORD")
OUTPUT_HTML = "scripts/data/icumap/all_courses.html"

async def main():
    if not USER_ID or not PASSWORD:
        raise ValueError("Environment variables ICUMAP_USER or ICUMAP_PASSWORD are not set.")

    os.makedirs(os.path.dirname(OUTPUT_HTML), exist_ok=True)

    async with async_playwright() as p:
        # Launch Chromium browser with options
        browser = await p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-blink-features=AutomationControlled",
            ]
        )
        
        # Emulate desktop browser context
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800},
            locale="ja-JP",
            timezone_id="Asia/Tokyo"
        )
        
        # Avoid automation detection
        await context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        
        page = await context.new_page()

        print("1. Navigating to initial page...")
        await page.goto(ICUMAP_URL, wait_until="domcontentloaded")

        # Handle Gluegent Gate SSO login if present
        if await page.locator("#username_input").count() > 0:
            print("2. Gluegent Gate SSO login detected. Submitting credentials...")
            
            await page.fill("#username_input", USER_ID)
            await page.fill("#password_input", PASSWORD)
            
            # Submit login form and expect navigation
            async with page.expect_navigation(wait_until="domcontentloaded", timeout=60000):
                await page.click("#login_button")

            print("   Credentials submitted. Waiting for SSO redirection to complete...")

        # Wait for the main page selector to load
        try:
            # Wait for main page element or URL redirect back to icumap
            await page.wait_for_selector("#ctl00_bdy_base", state="attached", timeout=45000)
            print("   Successfully reached the main page.")
        except Exception as e:
            # Capture screenshot on failure for debugging
            await page.screenshot(path="error_login.png", full_page=True)
            print(f"❌ Current Page URL: {page.url}")
            print(f"❌ Current Page Title: {await page.title()}")
            raise RuntimeError(f"Authentication failed: Unable to reach main page. Saved screenshot to error_login.png. Details: {e}")

        # Execute search query
        print("3. Executing search query...")
        search_btn = "#ctl00_ContentPlaceHolder1_btn_search"
        if await page.locator(search_btn).count() > 0:
            async with page.expect_navigation(wait_until="domcontentloaded", timeout=60000):
                await page.click(search_btn)
            print("   Search query executed successfully.")

        # Change display limit to ALL
        print("4. Changing page size limit to 'ALL'...")
        page_size_selector = "#ctl00_ContentPlaceHolder1_ddlPageSize"
        
        if await page.locator(page_size_selector).count() > 0:
            async with page.expect_navigation(wait_until="domcontentloaded", timeout=60000):
                await page.select_option(page_size_selector, value="ALL")
            
            # Wait until table rows are updated
            await page.wait_for_selector("#ctl00_ContentPlaceHolder1_grv_course tr:nth-child(2)", timeout=30000)
            print("   Display limit changed to ALL and records loaded successfully.")
        else:
            print("⚠️ Warning: Display limit dropdown was not found.")

        # Save HTML output
        html_content = await page.content()
        with open(OUTPUT_HTML, "w", encoding="utf-8") as f:
            f.write(html_content)

        print(f"5. HTML content successfully saved to: {OUTPUT_HTML}")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())