document.addEventListener("DOMContentLoaded", () => {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                console.log("Observed element:", entry.target);
                console.log("Is intersecting:", entry.isIntersecting);

                if (entry.isIntersecting) {
                    entry.target.classList.add("show");
                    entry.target.classList.remove("hidden"); // Ensure `.hidden` is removed
                    observer.unobserve(entry.target);
                }
            });
        },
        {
            rootMargin: "0px 0px 0px 0px", // Adjust this to trigger earlier
            threshold: 0.1, // Trigger when 10% of the element is visible
        }
    );

    const hiddenElements = document.querySelectorAll(".hidden");
    console.log("Hidden elements found:", hiddenElements);

    hiddenElements.forEach((el) => observer.observe(el));
});
