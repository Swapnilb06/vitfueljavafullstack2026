package com.volunteerportal.controller;

import com.volunteerportal.dto.CategoryRequest;
import com.volunteerportal.dto.CategoryResponse;
import com.volunteerportal.entity.Category;
import com.volunteerportal.service.CategoryService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    // Anyone authenticated can view categories
    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getAll() {

        List<CategoryResponse> responses =
                categoryService.findAll()
                        .stream()
                        .map(this::toResponse)
                        .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    // Anyone authenticated can view a single category
    @GetMapping("/{id}")
    public ResponseEntity<CategoryResponse> getById(
            @PathVariable Long id) {

        Category category = categoryService.findById(id);

        return ResponseEntity.ok(toResponse(category));
    }

    // Only ADMIN can create categories
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CategoryResponse> create(
            @RequestBody CategoryRequest request) {

        Category category = toEntity(request);

        Category saved = categoryService.save(category);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(toResponse(saved));
    }

    // Only ADMIN can update categories
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CategoryResponse> update(
            @PathVariable Long id,
            @RequestBody CategoryRequest request) {

        Category category = toEntity(request);

        Category updated = categoryService.update(id, category);

        return ResponseEntity.ok(toResponse(updated));
    }

    // Only ADMIN can delete categories
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id) {

        categoryService.deleteById(id);

        return ResponseEntity.noContent().build();
    }

    // ---- Manual DTO <-> Entity mapping ----

    private Category toEntity(CategoryRequest request) {

        Category category = new Category();

        category.setName(request.getName());
        category.setDescription(request.getDescription());

        return category;
    }

    private CategoryResponse toResponse(Category category) {

        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getDescription()
        );
    }
}