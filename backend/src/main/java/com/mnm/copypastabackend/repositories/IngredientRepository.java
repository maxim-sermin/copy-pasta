package com.mnm.copypastabackend.repositories;

import com.mnm.copypastabackend.entities.Ingredient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IngredientRepository extends JpaRepository<Ingredient, Long> {

    public Optional<Ingredient> findByNameIgnoreCase(String name);

    @Query("select i.name from Ingredient i")
    public List<String> getIngredientNames();

    public List<Ingredient> findAllByOrderByName();
}
