package com.mnm.copypastabackend.repositories;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import com.mnm.copypastabackend.entities.Recipe;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface RecipeRepository extends JpaRepository<Recipe, Long> {

    @Query("select distinct r from Recipe r left join r.labels l left join r.quantities q left join q.ingredient i where "
            + "((:ingredientNames) is null or i.name in (:ingredientNames)) and "
            + "((:labelNames) is null or l.name in (:labelNames)) and "
            + "(length(:recipeName) < 1 or lower(r.name) like lower(:recipeName))")
    Page<Recipe> filterRecipes(@Param("recipeName") String recipeName, @Param("ingredientNames") Collection<String> ingredientNames, @Param("labelNames") Collection<String> labelNames, Pageable pageable);

    @Query("select r from Recipe r")
    Page<Recipe> findAllSort(Pageable pageable);

    // leaving for reference (test performance once many entries)
    @Query("select r from Recipe r where r.quantities in (select q from Quantity q where q.ingredient in (select i.id from Ingredient i where i.name in (:ingredientNames))) or r.labels in (select l from Label l where l.name in (:labelNames)) or lower(r.name) like lower(:recipeName)")
    Page<Recipe> filterRecipesSubQuery(@Param("recipeName") String recipeName, @Param("ingredientNames") Collection<String> ingredientNames, @Param("labelNames") Collection<String> labelNames, Pageable pageable);

    @Query("select r.name from Recipe r where lower(r.name) like lower(:recipeName)")
    List<String> getRecipeNames(@Param("recipeName") String recipeName);

    @Query("select r.name from Recipe r")
    List<String> getAllRecipeNames();
    
    List<Recipe> findByNameIgnoreCase(String name);
}
