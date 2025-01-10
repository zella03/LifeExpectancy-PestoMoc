document.addEventListener("DOMContentLoaded", () => {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                console.log("Observed element:", entry.target);
                console.log("Is intersecting:", entry.isIntersecting);

                if (entry.isIntersecting) {
                    entry.target.classList.add("show");
                    entry.target.classList.remove("hidden");
                    observer.unobserve(entry.target); // Stop observing after showing
                }
            });
        },
        {
            root: null, // Use the viewport as the root
            rootMargin: "0px", // No margin
            threshold: 0.1, // Trigger when 10% of the element is visible
        }
    );

    const hiddenElements = document.querySelectorAll(".hidden");
    console.log("Hidden elements found:", hiddenElements);

    hiddenElements.forEach((el) => {
        observer.observe(el);
        console.log("Observing element:", el);
    });
});


const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("show");
                entry.target.classList.remove("hidden");
                observer.unobserve(entry.target);
            }
        });
    },
    {
        root: null,
        rootMargin: "0px 0px -100px 0px", // Adjust to trigger earlier
        threshold: 0.1, // 10% visibility
    }
);
