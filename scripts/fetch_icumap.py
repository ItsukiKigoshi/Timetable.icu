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
        browser = await p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-blink-features=AutomationControlled",
            ]
        )
        
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800},
            locale="ja-JP",
            timezone_id="Asia/Tokyo"
        )
        
        await context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        page = await context.new_page()

        print("1. Navigating to initial page...")
        await page.goto(ICUMAP_URL, wait_until="networkidle")

        # Handle Gluegent Gate SSO login
        if await page.locator("#username_input").count() > 0:
            print("2. Gluegent Gate SSO login detected. Submitting credentials...")
            await page.fill("#username_input", USER_ID)
            await page.fill("#password_input", PASSWORD)
            
            await page.click("#login_button")
            # Wait until redirection completes and returns to icumap domain
            await page.wait_for_url("**/SearchCO.aspx*", timeout=60000)
            await page.wait_for_load_state("networkidle")
            print("   Credentials submitted and redirection completed.")

        # Ensure main frame / container is loaded
        try:
            await page.wait_for_selector("#ctl00_bdy_base", state="attached", timeout=45000)
            print("   Successfully reached the main page.")
        except Exception as e:
            await page.screenshot(path="error_login.png", full_page=True)
            print(f"❌ Current Page URL: {page.url}")
            raise RuntimeError(f"Authentication failed: {e}")

        # Execute search query
        print("3. Executing search query...")
        search_btn = "#ctl00_ContentPlaceHolder1_btn_search"
        page_size_selector = "#ctl00_ContentPlaceHolder1_ddlPageSize"

        if await page.locator(search_btn).count() > 0:
            await page.click(search_btn)
            # ASP.NET PostBack: wait explicitly for the page size dropdown element to appear
            await page.wait_for_selector(page_size_selector, state="visible", timeout=45000)
            print("   Search query executed successfully.")
        else:
            await page.screenshot(path="error_login.png", full_page=True)
            raise RuntimeError("❌ Search button not found.")

        # Change display limit to ALL
        print("4. Changing page size limit to 'ALL'...")
        if await page.locator(page_size_selector).count() > 0:
            # Selecting option triggers ASP.NET PostBack
            await page.select_option(page_size_selector, value="ALL")
            
            # Wait for table to reload with all records
            table_selector = "#ctl00_ContentPlaceHolder1_grv_course"
            await page.wait_for_selector(table_selector, state="visible", timeout=60000)
            
            # Give short buffer for DOM rendering in headless Linux runner
            await page.wait_for_load_state("networkidle")
            await asyncio.sleep(2)
            print("   Display limit changed to ALL and records loaded successfully.")
        else:
            await page.screenshot(path="error_login.png", full_page=True)
            raise RuntimeError("⚠️ Display limit dropdown was not found.")

        # Save HTML output
        html_content = await page.content()
        with open(OUTPUT_HTML, "w", encoding="utf-8") as f:
            f.write(html_content)

        print(f"5. HTML content successfully saved to: {OUTPUT_HTML}")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())