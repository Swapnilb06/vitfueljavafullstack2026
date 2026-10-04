package com.volunteerportal.service;

import com.volunteerportal.entity.Category;
import com.volunteerportal.repository.CategoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public List<Category> findAll() {
        return categoryRepository.findAll();
    }

    public Category findById(Long id) {

        if (id == null) {
            throw new IllegalArgumentException(
                    "Category ID is required"
            );
        }

        return categoryRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Category not found with id: " + id
                        )
                );
    }

    public Category save(Category category) {

        validateCategory(category);

        String name = category.getName().trim();

        boolean categoryExists =
                categoryRepository.findAll()
                        .stream()
                        .anyMatch(existing ->
                                existing.getName() != null
                                        && existing.getName()
                                                .trim()
                                                .equalsIgnoreCase(name)
                        );

        if (categoryExists) {
            throw new IllegalArgumentException(
                    "A category with this name already exists"
            );
        }

        category.setName(name);

        return categoryRepository.save(category);
    }

    public Category update(
            Long id,
            Category category) {

        Category existing = findById(id);

        validateCategory(category);

        String name = category.getName().trim();

        boolean duplicateName =
                categoryRepository.findAll()
                        .stream()
                        .anyMatch(other ->
                                other.getId() != null
                                        && !other.getId().equals(id)
                                        && other.getName() != null
                                        && other.getName()
                                                .trim()
                                                .equalsIgnoreCase(name)
                        );

        if (duplicateName) {
            throw new IllegalArgumentException(
                    "A category with this name already exists"
            );
        }

        existing.setName(name);
        existing.setDescription(
                category.getDescription()
        );

        return categoryRepository.save(existing);
    }

    public void deleteById(Long id) {

        Category existing = findById(id);

        categoryRepository.delete(existing);
    }

    private void validateCategory(Category category) {

        if (category == null) {
            throw new IllegalArgumentException(
                    "Category data is required"
            );
        }

        if (category.getName() == null
                || category.getName().trim().isEmpty()) {

            throw new IllegalArgumentException(
                    "Category name is required"
            );
        }
    }
}