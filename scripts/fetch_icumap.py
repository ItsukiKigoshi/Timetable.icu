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
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        print("1. Navigating to initial page...")
        await page.goto(ICUMAP_URL, wait_until="networkidle")

        # Handle Gluegent Gate SSO Authentication
        if await page.locator("#username_input").count() > 0:
            print("2. Gluegent Gate SSO login detected. Submitting credentials...")
            
            await page.fill("#username_input", USER_ID)
            await page.fill("#password_input", PASSWORD)
            
            async with page.expect_navigation(wait_until="networkidle"):
                await page.click("#login_button")

            await page.wait_for_load_state("networkidle")
            print("   Authentication submitted, redirected to main page.")

        # Verify successful login
        if await page.locator("#ctl00_bdy_base").count() == 0:
            raise RuntimeError("Authentication failed: Unable to reach main page.")

        # Execute search query
        print("3. Executing Search query...")
        search_btn_selector = "#ctl00_ContentPlaceHolder1_btn_search"
        if await page.locator(search_btn_selector).count() > 0:
            async with page.expect_navigation(wait_until="networkidle"):
                await page.click(search_btn_selector)
            print("   Search executed.")

        # Change page size limit to ALL
        print("4. Changing display limit to 'ALL'...")
        page_size_selector = "#ctl00_ContentPlaceHolder1_ddlPageSize"
        
        if await page.locator(page_size_selector).count() > 0:
            select_element = page.locator(page_size_selector)
            
            async with page.expect_navigation(wait_until="networkidle"):
                await select_element.select_option(value="ALL")

            await page.wait_for_selector("#ctl00_ContentPlaceHolder1_grv_course tr:nth-child(2)", timeout=15000)
            print("   Display limit successfully changed to ALL and records loaded.")
        else:
            print("⚠️ Warning: Display limit dropdown not found.")

        # Save HTML file locally
        html_content = await page.content()
        with open(OUTPUT_HTML, "w", encoding="utf-8") as f:
            f.write(html_content)

        print(f"5. HTML successfully saved to: {OUTPUT_HTML}")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())